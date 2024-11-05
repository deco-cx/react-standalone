# React Browser Template (React + React Router + TailwindCSS + TypeScript)

This project is a **React** template designed to run directly in the browser without the need for **Node.js** or any other server. It simplifies development by enabling you to write and bundle your **React** code right in the browser, with support for **TailwindCSS** and **TypeScript**. All the bundling and plumbing required to make this work happens just-in-time (JIT), making this template perfect for **prototyping new ideas at the speed of light**.

## Features

- **React**: The modern library for building user interfaces.
- **React Router**: Remix.js-like routing system.
- **TailwindCSS**: A utility-first CSS framework for rapid UI development.
- **TypeScript**: A superset of JavaScript for better code safety and tooling.
- **No Server Required**: Run everything directly in the browser, no backend setup.
- **Just-in-Time (JIT) Compilation**: Your React components are compiled and bundled in real time.
- **Instant Feedback (HMR)**: See your changes instantly with no need to restart or reload a local development server.
- **Prototyping Ready**: Ideal for quickly testing new ideas without any build tools, setup, or installation overhead.

## Modern Browser Features

This template relies on cutting-edge browser technologies to ensure fast and efficient development:

- **Import Maps**: Used to handle module imports directly in the browser without needing a bundler.
- **Just-in-Time Compilation via Babel**: Handles real-time TypeScript and JSX transpiling in the browser, making sure you can use modern JavaScript and React features without a server-side build step.
- **Tailwind CDN**: TailwindCSS is loaded via CDN, allowing you to start using utility-first styles without any installation or setup.

## How It Works

This template leverages browser-based tools to handle the bundling of React, TypeScript, and TailwindCSS code in real time. By using modern browser features, it eliminates the need for Node.js or any backend bundling tools, making the development process lightweight and incredibly fast.

The magic happens entirely in the browser:
- Write your React components, TypeScript logic, and TailwindCSS styles.
- The code is compiled and bundled in real time using Babel, with styles managed through Tailwind’s CDN.
- The result is delivered straight to the browser without any server-side logic.

## Getting Started

1. **Clone the Repository**

   ```bash
   git clone https://github.com/tlgimenes/react-standalone.git
   cd react-standalone
   ```

2. **Open `index.html` in Your Browser**

   Simply open the `index.html` file in your browser. The browser will handle the rest, including compiling and rendering your React components.

3. **Start Coding**

   Open the `src/` directory and start editing the files. Your changes will be reflected in real time in the browser.

## Project Structure

```plaintext
.
├── index.html             # Entry point of the application
├── index.js               # Setup react hmr and service worker
├── sw.js                  # JIT Typescript compiler
├── app/
│   ├── App.tsx            # Main React component
│   ├── entry.client.tsx   # React DOM rendering entry
│   ├── ErrorPage.tsx      # 500 or 404 status page component
│   └── routes/            # Custom styles using TailwindCSS
│       └── index.tsx      # Home Page
└── README.md              # Project documentation
```

## Technologies Used

- **React**: For building UI components.
- **React Router**: For routing and data fetching.
- **TailwindCSS (via CDN)**: To design beautiful user interfaces with utility-first classes, no build step required.
- **TypeScript**: Adds strong typing to JavaScript.
- **Babel (JIT Compilation)**: To transpile JSX and TypeScript code in real time, directly in the browser.
- **Import Maps**: For handling JavaScript imports without requiring bundlers like Webpack or Rollup.

## Customizing the Template

You can easily extend this template to include more libraries and tools as needed. Here are some ways you can modify it:

- Add more global styles in the `styles.css` file.
- Add additional libraries by including their scripts in `index.html`.
- Modify the `App.tsx` file to include more complex component logic.

## Contributing

Contributions are welcome! If you find any bugs or have feature suggestions, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.