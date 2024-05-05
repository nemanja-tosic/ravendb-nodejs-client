import { defineConfig, Options } from "tsup";

export default defineConfig(options => {
	const commonOptions: Partial<Options> = {
		external: [/node:.*/],
		entry: {
			ravendb: "src/index.ts"
		},
		sourcemap: true,
		dts: true,
		clean: true,
		...options
	}

	const productionOptions = {
		minify: true,
		esbuildOptions(options, _context) {
			options.mangleProps = /_$/
		},
		define: {
			"process.env.NODE_ENV": JSON.stringify("production")
		}
	}

	return [
		// ESM, standard bundler
		{
			...commonOptions,
			...productionOptions,
			format: ["esm"],
			outDir: "./dist/",
		},
		// CJS
		{
			...commonOptions,
			...productionOptions,
			format: "cjs",
			outDir: "./dist/cjs/"
		}
	]
})
