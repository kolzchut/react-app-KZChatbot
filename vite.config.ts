import path from "path";
import { defineConfig, loadEnv, Plugin, ConfigEnv, UserConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { startMockupServer } from "./mockup-server";
import { startShimServer } from "./shim-server";

// VITE_MODE selects the local dev backend:
//   "mockup" → in-process canned-response server (no real backend needed)
//   "shim"   → in-process middleware shim that forwards to a real RAG backend
//              (configured via RAG_API_URL; see README for the tunnel)
//   (unset)  → proxy to VITE_API_URL (e.g. a real MediaWiki rest.php)
// https://vitejs.dev/config/
export default defineConfig(async ({ mode, command }: ConfigEnv): Promise<UserConfig> => {
	const env = loadEnv(mode, process.cwd(), "");
	const useMockup = env.VITE_MODE === "mockup";
	const useShim = env.VITE_MODE === "shim";
	const isBuild = command === 'build';
	const useLocalBackend = (useMockup || useShim) && !isBuild;

	// Start the chosen in-process backend (dev/preview only — never at build).
	let localServer: { url: string; close: () => Promise<void> } | null = null;
	if (useMockup && !isBuild) {
		localServer = await startMockupServer();
		console.log(`🔶 Using mockup server at ${localServer.url}`);
	} else if (useShim && !isBuild) {
		const ragUrl = env.RAG_API_URL || "http://localhost:5000";
		localServer = await startShimServer({
			ragUrl,
			sendPageId: env.SHIM_SEND_PAGE_ID !== "false",
			limits: {
				maxQuestions: Number(env.SHIM_MAX_QUESTIONS) || 0,
				questionChars: Number(env.SHIM_QUESTION_CHARS) || 0,
				feedbackChars: Number(env.SHIM_FEEDBACK_CHARS) || 0,
			},
		});
		console.log(`🟢 Using middleware shim at ${localServer.url} → RAG ${ragUrl}`);
	}

	// API target - the local backend, or the configured remote API URL.
	const apiTarget = useLocalBackend ? localServer?.url : env.VITE_API_URL;

	const plugins: PluginOption[] = [react()];

	// When a local backend is running, tear it down with Vite and show a banner.
	if (useLocalBackend) {
		const label = useShim ? "SHIM MODE ACTIVE" : "MOCKUP MODE ACTIVE";
		const bg = useShim ? "#22C55E" : "#FFC107";
		const localBackendPlugin: Plugin = {
			name: 'local-backend-plugin',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url?.endsWith('.html')) {
						server.transformIndexHtml(req.url, `
              <!-- Running with a local dev backend -->
              <script>
                console.log('%c🔶 ${label}', 'background: ${bg}; color: #000; padding: 4px 8px; border-radius: 4px;');
              </script>
            `).then(html => {
							res.setHeader('Content-Type', 'text/html');
							res.end(html);
						});
						return;
					}
					next();
				});
			},
			closeBundle() {
				if (localServer) {
					localServer.close().catch(err => {
						console.error('Error closing local backend:', err);
					});
					console.log('🔶 Local backend closed');
				}
			}
		};

		plugins.push(localBackendPlugin);
	}

	// Proxy: when a local backend is running, route both /rest.php and /api to it
	// (the client uses /api/... in dev). Otherwise proxy /api to the remote URL.
	const proxyConfig = useLocalBackend
		? {
			"/rest.php": {
				target: apiTarget,
				changeOrigin: true,
				secure: false,
			},
			"/api": {
				target: apiTarget,
				changeOrigin: true,
				secure: false,
				rewrite: (p: string) => p.replace(/^\/api/, ""),
			}
		}
		: {
			"/api": {
				target: apiTarget,
				changeOrigin: true,
				secure: false,
				rewrite: (p: string) => p.replace(/^\/api/, ""),
			}
		};

	return {
		define: {
			// We don't expose the mockup mode to client code
			'import.meta.env.VITE_LOCALE': JSON.stringify(env.VITE_LOCALE || 'he'),
		},
		build: {
			// Inline all assets as data URIs. The bundle is loaded by MediaWiki from
			// the extension path, but emitted asset files would resolve against the
			// site root (/assets/...) and 404, so keep this above the largest asset.
			assetsInlineLimit: 16384,
			rollupOptions: {
				output: {
					format: "iife",
					entryFileNames: `assets/[name].js`,
					chunkFileNames: `assets/[name].js`,
					assetFileNames: `assets/[name].[ext]`,
				},
			},
		},
		server: {
			proxy: proxyConfig,
			cors: false,
		},
		preview: {
			proxy: proxyConfig,
			cors: false,
		},
		plugins,
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	};
});
