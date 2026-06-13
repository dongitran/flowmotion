import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';

const appRoot = dirname(fileURLToPath(import.meta.url));
const flowmotionAssetsDir = resolve(appRoot, 'node_modules/@dongtran/flowmotion/dist/assets');

function getFlowmotionWorkerAssets(): string[] {
	if (!existsSync(flowmotionAssetsDir)) {
		return [];
	}

	return readdirSync(flowmotionAssetsDir).filter((fileName) => fileName.endsWith('.js'));
}

function copyFlowmotionWorkerAssets(targetAssetsDir: string): void {
	const assetNames = getFlowmotionWorkerAssets();
	mkdirSync(targetAssetsDir, { recursive: true });

	assetNames.forEach((fileName) => {
		copyFileSync(resolve(flowmotionAssetsDir, fileName), resolve(targetAssetsDir, fileName));
	});
}

function flowmotionWorkerAssets(): Plugin {
	let resolvedConfig: ResolvedConfig;

	return {
		name: 'flowmotion-worker-assets',
		configResolved(config) {
			resolvedConfig = config;
		},
		configureServer(server) {
			server.middlewares.use('/assets', (request, response, next) => {
				const fileName = basename(request.url?.split('?')[0] ?? '');

				if (!getFlowmotionWorkerAssets().includes(fileName)) {
					next();
					return;
				}

				response.statusCode = 200;
				response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
				createReadStream(resolve(flowmotionAssetsDir, fileName)).pipe(response);
			});
		},
		writeBundle() {
			copyFlowmotionWorkerAssets(
				resolve(resolvedConfig.root, resolvedConfig.build.outDir, 'assets')
			);
		},
	};
}

export default defineConfig({
	plugins: [flowmotionWorkerAssets(), react()],
	optimizeDeps: {
		include: ['@dongtran/flowmotion'],
	},
	server: {
		host: '127.0.0.1',
		port: 5174,
	},
});
