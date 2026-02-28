import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Editor } from './Editor';
import userEvent from '@testing-library/user-event';

// Mock fetch globally
global.fetch = vi.fn();

describe('Editor Prompt Builder Workflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup default fetch mock for user credits
    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/user') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ credits: 10 }),
        });
      }
      if (url === 'https://picsum.photos/seed/demo/800/600') {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['fake image data'], { type: 'image/jpeg' })),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('loads demo photo and updates the prompt based on user selections', async () => {
    const user = userEvent.setup();
    render(<Editor />);

    // Wait for the "Try Demo Photo" button to be available and click it
    const demoButton = await screen.findByRole('button', { name: /Try Demo Photo/i });
    await user.click(demoButton);

    // After loading the demo photo, the editor UI should appear.
    // The default room type is "Living Room" and style is "Modern".
    // The prompt should be visible in the UI.
    await waitFor(() => {
      expect(screen.getByText(/Photoreal modern virtual staging real estate Living Room, add furniture keeping architecture exact, MLS photo./i)).toBeInTheDocument();
    });

    // Change the Style to "Farmhouse"
    const farmhouseButton = screen.getByRole('button', { name: 'Farmhouse' });
    await user.click(farmhouseButton);

    // Verify the prompt updated
    await waitFor(() => {
      expect(screen.getByText(/Photoreal farmhouse virtual staging real estate Living Room, add furniture keeping architecture exact, MLS photo./i)).toBeInTheDocument();
    });

    // Change the Paint to "Navy"
    const paintSelect = screen.getByRole('combobox', { name: /Paint/i });
    await user.selectOptions(paintSelect, 'Navy');

    // Verify the prompt updated with the paint selection
    await waitFor(() => {
      expect(screen.getByText(/Photoreal farmhouse virtual staging real estate Living Room, add furniture keeping architecture exact, MLS photo. \+ navy paint./i)).toBeInTheDocument();
    });

    // Change the Floors to "Oak"
    const floorsSelect = screen.getByRole('combobox', { name: /Floors/i });
    await user.selectOptions(floorsSelect, 'Oak');

    // Verify the prompt updated with the floors selection
    await waitFor(() => {
      expect(screen.getByText(/Photoreal farmhouse virtual staging real estate Living Room, add furniture keeping architecture exact, MLS photo. \+ navy paint \+ oak floors./i)).toBeInTheDocument();
    });
    
    // Switch to Custom Prompt mode
    const customModeButton = screen.getByRole('button', { name: 'Custom' });
    await user.click(customModeButton);
    
    // Type a custom prompt
    const customTextarea = screen.getByPlaceholderText(/Describe exactly how you want the room staged/i);
    await user.type(customTextarea, 'Make it look like a spaceship');
    
    // Verify the custom prompt is reflected in the Ready to Stage panel
    await waitFor(() => {
      expect(screen.getByText(/"Make it look like a spaceship"/i)).toBeInTheDocument();
    });
  });
});
