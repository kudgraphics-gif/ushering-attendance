import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import './ThemeToggle.css';

export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
        >
            <motion.div
                className="theme-toggle__track"
                animate={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                }}
            >
                <motion.div
                    className="theme-toggle__thumb"
                    animate={{
                        x: isDark ? 28 : 2,
                        backgroundColor: isDark ? '#000000' : '#FFFFFF'
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                    <div className="theme-toggle__icon">
                        {isDark ? (
                            <Moon size={14} color="#D4AF37" />
                        ) : (
                            <Sun size={14} color="#D4AF37" />
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </button>
    );
}
