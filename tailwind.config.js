/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fdf7ef',
                    100: '#faedda',
                    200: '#f3d7b5',
                    300: '#ebbc86',
                    400: '#e29755',
                    500: '#db7c34',
                    600: '#cd6529',
                    700: '#aa4e24',
                    800: '#954527',
                    900: '#6e3620',
                    950: '#3b190f',
                },
                albescentWhite: {
                    50: '#fbf8f1',
                    100: '#f6eede',
                    200: '#f1e3cb',
                    300: '#e1c190',
                    400: '#d4a163',
                    500: '#ca8845',
                    600: '#bc723a',
                    700: '#9d5b31',
                    800: '#7e4a2e',
                    900: '#663e28',
                    950: '#371e13',
                },
            },
            typography: {
                DEFAULT: {
                    css: {
                        maxWidth: 'none',
                        color: 'inherit',
                        a: {
                            color: '#0ea5e9',
                            '&:hover': {
                                color: '#0284c7',
                            },
                        },
                        p: {
                            marginTop: '0.5em',
                            marginBottom: '0.5em',
                        },
                    },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
} 