import { Box, Code2, Play, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { examples } from './examples';
import FlowEditorPane from './FlowEditorPane';
import ViewerPane from './ViewerPane';
import type { BuildStatus, BuiltFlowBuild, FlowBuild } from './types';
import './app.css';

type ActiveView = 'preview' | 'code';

const packageName = '@dongtran/flowmotion';
const packageVersion = '0.8.7';

function getBuildStatus(build: FlowBuild): BuildStatus {
	if (build.state === 'uninitiated') {
		return 'waiting';
	}

	return build.state;
}

function getArtifactSize(build?: BuiltFlowBuild) {
	if (!build) {
		return 'No artifact';
	}

	return `${Math.round(build.artificats.bundle.length / 1024)} KB bundle`;
}

function useMeasuredHeight<T extends HTMLElement>() {
	const elementRef = useRef<T | null>(null);
	const [height, setHeight] = useState(640);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) {
			return undefined;
		}

		const updateHeight = () => {
			const nextHeight = Math.max(360, Math.floor(element.getBoundingClientRect().height));
			setHeight((currentHeight) =>
				currentHeight === nextHeight ? currentHeight : nextHeight
			);
		};

		updateHeight();
		const observer = new ResizeObserver(updateHeight);
		observer.observe(element);
		window.addEventListener('resize', updateHeight);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', updateHeight);
		};
	}, []);

	return [elementRef, `${height}px`] as const;
}

export default function App() {
	const [activeExampleId, setActiveExampleId] = useState(examples[0].id);
	const [activeView, setActiveView] = useState<ActiveView>('code');
	const [status, setStatus] = useState<BuildStatus>('waiting');
	const [builtBuild, setBuiltBuild] = useState<BuiltFlowBuild>();
	const [lastEvent, setLastEvent] = useState('waiting for build');
	const [errorMessages, setErrorMessages] = useState<string[]>([]);
	const [instanceKey, setInstanceKey] = useState(0);
	const [surfaceRef, surfaceHeight] = useMeasuredHeight<HTMLDivElement>();

	const activeExample = useMemo(
		() => examples.find((example) => example.id === activeExampleId) ?? examples[0],
		[activeExampleId]
	);

	const selectExample = useCallback((exampleId: string) => {
		setActiveExampleId(exampleId);
		setActiveView('code');
		setStatus('waiting');
		setBuiltBuild(undefined);
		setLastEvent('sample changed');
		setErrorMessages([]);
		setInstanceKey((currentKey) => currentKey + 1);
	}, []);

	const handleBuildChange = useCallback((build: FlowBuild) => {
		setStatus(getBuildStatus(build));
		setLastEvent(`build.${build.state}`);
		setErrorMessages([]);

		if (build.state === 'errored') {
			setErrorMessages(
				build.errors.map((error) => {
					const location = error.sourceable
						? `${error.fileName}:${error.position.startLine}:${error.position.startCharacter}`
						: error.code;
					return `${location} ${error.message ?? error.code}`;
				})
			);
		}
	}, []);

	const handleBuilt = useCallback((build: BuiltFlowBuild) => {
		setBuiltBuild(build);
		setActiveView('preview');
	}, []);

	return (
		<main className="app-shell">
			<header className="topbar">
				<div className="brand">
					<Box size={22} />
					<div>
						<h1>Flowmotion Studio</h1>
						<p>
							Using <strong>{packageName}</strong> from npm, version {packageVersion}
						</p>
					</div>
				</div>

				<div className="status-strip" aria-label="Build status">
					<span className={`status-pill status-${status}`}>{status}</span>
					<span>{getArtifactSize(builtBuild)}</span>
					<span>{lastEvent}</span>
				</div>
			</header>

			<section className="control-band" aria-label="Flow controls">
				<div className="sample-list">
					{examples.map((example) => (
						<button
							key={example.id}
							className={example.id === activeExample.id ? 'sample active' : 'sample'}
							type="button"
							title={example.summary}
							onClick={() => selectExample(example.id)}
						>
							<span>{example.title}</span>
							<small>{example.summary}</small>
						</button>
					))}
				</div>

				<div className="view-tabs" role="tablist" aria-label="Workspace view">
					<button
						className={activeView === 'preview' ? 'tab active' : 'tab'}
						type="button"
						disabled={!builtBuild}
						onClick={() => setActiveView('preview')}
					>
						<Play size={16} />
						Preview
					</button>
					<button
						className={activeView === 'code' ? 'tab active' : 'tab'}
						type="button"
						onClick={() => setActiveView('code')}
					>
						<Code2 size={16} />
						Code
					</button>
					<button
						className="tab ghost"
						type="button"
						onClick={() => selectExample(activeExample.id)}
					>
						<RefreshCw size={16} />
						Reset
					</button>
				</div>
			</section>

			<section className="workspace" aria-label="Flowmotion workspace">
				<div className="flow-surface" ref={surfaceRef}>
					<div
						className={
							activeView === 'preview' ? 'flow-pane active' : 'flow-pane inactive'
						}
					>
						{builtBuild ? (
							<ViewerPane
								example={activeExample}
								build={builtBuild}
								height={surfaceHeight}
							/>
						) : null}
					</div>
					<div
						className={
							activeView === 'code' ? 'flow-pane active' : 'flow-pane inactive'
						}
					>
						<FlowEditorPane
							key={`${activeExample.id}-${instanceKey}`}
							example={activeExample}
							height={surfaceHeight}
							onBuildChange={handleBuildChange}
							onBuilt={handleBuilt}
							onAnalytics={setLastEvent}
						/>
					</div>
					{errorMessages.length > 0 && (
						<aside className="error-panel" aria-label="Build errors">
							{errorMessages.map((message) => (
								<p key={message}>{message}</p>
							))}
						</aside>
					)}
				</div>
			</section>
		</main>
	);
}
