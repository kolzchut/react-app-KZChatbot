import path from "path";
import { defineConfig, loadEnv, Plugin, ConfigEnv, UserConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { startMockupServer } from "./mockup-server";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode, command }: ConfigEnv): Promise<UserConfig> => {
	const env = loadEnv(mode, process.cwd(), "");
	const useMockup = env.VITE_MODE === "mockup";
	const isBuild = command === 'build';

	// Start mockup server if VITE_MODE is set to mockup AND we're not in build mode
	let mockupServer = null;
	if (useMockup && !isBuild) {
		mockupServer = await startMockupServer();
		console.log(`🔶 Using mockup server at ${mockupServer.url}`);
	}

	// API target - use mockup server or the configured API URL
	const apiTarget = (useMockup && !isBuild)
		? mockupServer?.url
		: env.VITE_API_URL;

	// Create plugins array
	const plugins: PluginOption[] = [react()];

	// Add mockup plugin only if mockup mode is enabled and we're not building
	if (useMockup && !isBuild) {
		const mockupPlugin: Plugin = {
			name: 'mockup-mode-plugin',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					// Add an indicator in dev tools that we're in mockup mode
					if (req.url?.endsWith('.html')) {
						server.transformIndexHtml(req.url, `
              <!-- Running in mockup mode -->
              <script>
                console.log('%c🔶 MOCKUP MODE ACTIVE', 'background: #FFC107; color: #000; padding: 4px 8px; border-radius: 4px;');
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
			// This will be called when Vite is closing
			closeBundle() {
				if (mockupServer) {
					mockupServer.close().catch(err => {
						console.error('Error closing mockup server:', err);
					});
					console.log('🔶 Mockup server closed');
				}
			}
		};

		plugins.push(mockupPlugin);
	}

	// Configure proxy differently based on whether we're in mockup mode
	const proxyConfig = (useMockup && !isBuild)
		? {
			// In mockup mode, proxy everything to the mockup server
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
			// Normal proxy configuration
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
		},
		build: {
			assetsInlineLimit: 8096,
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
