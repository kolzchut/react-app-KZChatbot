import { renderHook, act } from '@testing-library/react'
import { useMobile } from '../useMobile'

// Mock window.innerWidth and resize events
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

const fireResize = (width: number) => {
  mockInnerWidth(width)
  window.dispatchEvent(new Event('resize'))
}

describe('useMobile Hook', () => {
  const originalInnerWidth = window.innerWidth

  afterEach(() => {
    // Reset window.innerWidth to original value
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  describe('Initial State', () => {
    it('returns true when initial window width is below mobile breakpoint', () => {
      mockInnerWidth(767) // Just below 768px breakpoint
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(true)
    })

    it('returns true when initial window width is exactly at mobile breakpoint', () => {
      mockInnerWidth(767) // Just below 768px breakpoint
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(true)
    })

    it('returns false when initial window width is at desktop breakpoint', () => {
      mockInnerWidth(768) // At 768px breakpoint
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(false)
    })

    it('returns false when initial window width is above desktop breakpoint', () => {
      mockInnerWidth(1024) // Desktop width
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(false)
    })
  })

  describe('Resize Event Handling', () => {
    it('updates to mobile when window is resized below breakpoint', () => {
      mockInnerWidth(1024) // Start desktop
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(false)
      
      act(() => {
        fireResize(600) // Resize to mobile
      })
      
      expect(result.current).toBe(true)
    })

    it('updates to desktop when window is resized above breakpoint', () => {
      mockInnerWidth(600) // Start mobile
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(true)
      
      act(() => {
        fireResize(1024) // Resize to desktop
      })
      
      expect(result.current).toBe(false)
    })

    it('handles multiple resize events correctly', () => {
      mockInnerWidth(1024) // Start desktop
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(false)
      
      // Resize to mobile
      act(() => {
        fireResize(600)
      })
      expect(result.current).toBe(true)
      
      // Resize back to desktop
      act(() => {
        fireResize(900)
      })
      expect(result.current).toBe(false)
      
      // Resize to mobile again
      act(() => {
        fireResize(500)
      })
      expect(result.current).toBe(true)
    })

    it('handles resize to exact breakpoint values correctly', () => {
      mockInnerWidth(800) // Start desktop
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(false)
      
      // Resize to exactly 768px (should be desktop)
      act(() => {
        fireResize(768)
      })
      expect(result.current).toBe(false)
      
      // Resize to 767px (should be mobile)
      act(() => {
        fireResize(767)
      })
      expect(result.current).toBe(true)
    })

    it('does not trigger unnecessary re-renders when staying in same category', () => {
      mockInnerWidth(1024) // Start desktop
      const { result } = renderHook(() => useMobile())
      const initialValue = result.current
      
      // Resize within desktop range
      act(() => {
        fireResize(900) // Still desktop
      })
      
      expect(result.current).toBe(initialValue)
      expect(result.current).toBe(false)
      
      // Another resize within desktop range
      act(() => {
        fireResize(1200) // Still desktop
      })
      
      expect(result.current).toBe(false)
    })
  })

  describe('Event Listener Management', () => {
    it('adds resize event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      
      renderHook(() => useMobile())
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      
      addEventListenerSpy.mockRestore()
    })

    it('removes resize event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = renderHook(() => useMobile())
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      
      removeEventListenerSpy.mockRestore()
    })

    it('does not cause memory leaks when unmounted', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = renderHook(() => useMobile())
      
      // Get the actual function that was added
      const addedFunction = addEventListenerSpy.mock.calls[0][1]
      
      unmount()
      
      // Verify the same function is removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', addedFunction)
      
      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('handles window width of 0', () => {
      mockInnerWidth(0)
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(true)
    })

    it('handles very large window widths', () => {
      mockInnerWidth(99999)
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(false)
    })

    it('handles negative window width (edge case)', () => {
      mockInnerWidth(-100)
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(true) // Less than 768
    })
  })

  describe('Common Screen Sizes', () => {
    const testCases = [
      { width: 320, expected: true, device: 'iPhone SE' },
      { width: 375, expected: true, device: 'iPhone 12 Pro' },
      { width: 414, expected: true, device: 'iPhone 12 Pro Max' },
      { width: 768, expected: false, device: 'iPad Portrait' },
      { width: 834, expected: false, device: 'iPad Air' },
      { width: 1024, expected: false, device: 'iPad Landscape' },
      { width: 1280, expected: false, device: 'Desktop' },
      { width: 1920, expected: false, device: 'Full HD Desktop' }
    ]

    testCases.forEach(({ width, expected, device }) => {
      it(`correctly identifies ${device} (${width}px) as ${expected ? 'mobile' : 'desktop'}`, () => {
        mockInnerWidth(width)
        const { result } = renderHook(() => useMobile())
        
        expect(result.current).toBe(expected)
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('simulates real user resizing from desktop to mobile', () => {
      // Start with desktop
      mockInnerWidth(1280)
      const { result } = renderHook(() => useMobile())
      
      expect(result.current).toBe(false)
      
      // Simulate gradual resize (like a user dragging browser window)
      const resizeSteps = [1200, 1000, 900, 800, 750, 600]
      
      resizeSteps.forEach((width) => {
        act(() => {
          fireResize(width)
        })
        
        if (width >= 768) {
          expect(result.current).toBe(false)
        } else {
          expect(result.current).toBe(true)
        }
      })
    })

    it('maintains state correctly during rapid resize events', () => {
      mockInnerWidth(1000)
      const { result } = renderHook(() => useMobile())
      
      // Simulate rapid resizing
      act(() => {
        fireResize(600) // mobile
        fireResize(800) // desktop
        fireResize(700) // mobile
        fireResize(1000) // desktop
        fireResize(500) // mobile
      })
      
      expect(result.current).toBe(true)
    })
  })
})