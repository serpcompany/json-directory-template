import { fireEvent, render, screen } from '@/test/test-utils';
import { ModeToggle } from '@thedaviddias/web-core/mode-toggle';
import { useTheme } from 'next-themes';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

const mockedUseTheme = useTheme as jest.Mock;

describe('ModeToggle', () => {
  it('toggles from the resolved system light theme to dark', () => {
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      setTheme,
      theme: 'system',
    });

    render(<ModeToggle />);

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('toggles from the resolved system dark theme to light', () => {
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue({
      resolvedTheme: 'dark',
      setTheme,
      theme: 'system',
    });

    render(<ModeToggle />);

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('toggles from the explicit light theme to dark when no resolved theme is available', () => {
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue({
      resolvedTheme: undefined,
      setTheme,
      theme: 'light',
    });

    render(<ModeToggle />);

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('toggles from the explicit dark theme to light when no resolved theme is available', () => {
    const setTheme = jest.fn();

    mockedUseTheme.mockReturnValue({
      resolvedTheme: undefined,
      setTheme,
      theme: 'dark',
    });

    render(<ModeToggle />);

    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
