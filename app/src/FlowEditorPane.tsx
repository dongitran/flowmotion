import { Editor } from '@dongtran/flowmotion';
import type { EditorProps } from '@dongtran/flowmotion/dist/types';
import { memo, useCallback, useEffect, useRef } from 'react';
import type { BuiltFlowBuild, FlowBuild, FlowExample } from './types';

type SubscriptionLike = {
	unsubscribe: () => void;
};

type EditorMountParams = Parameters<NonNullable<EditorProps['onMount']>>[0];

function isFlowBuild(value: unknown): value is FlowBuild {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	return typeof (value as { state?: unknown }).state === 'string';
}

function FlowEditorPane(props: {
	example: FlowExample;
	height: string;
	onBuildChange: (build: FlowBuild) => void;
	onBuilt: (build: BuiltFlowBuild) => void;
	onAnalytics: (eventName: string) => void;
}) {
	const { example, height, onAnalytics, onBuildChange, onBuilt } = props;
	const subscriptions = useRef<SubscriptionLike[]>([]);

	const clearSubscriptions = useCallback(() => {
		subscriptions.current.forEach((subscription) => subscription.unsubscribe());
		subscriptions.current = [];
	}, []);

	const handleMount = useCallback(
		(params: EditorMountParams) => {
			clearSubscriptions();

			const buildSubscription = params.stateChangeObservable.subscribe((event) => {
				if (event.source !== 'build' || !isFlowBuild(event.newState)) {
					return;
				}

				onBuildChange(event.newState);
				if (event.newState.state === 'built') {
					onBuilt(event.newState);
				}
			});

			const analyticsSubscription = params.analyticsObservable.subscribe((event) => {
				onAnalytics(event.event);
			});

			subscriptions.current = [buildSubscription, analyticsSubscription];
		},
		[clearSubscriptions, onAnalytics, onBuildChange, onBuilt]
	);

	useEffect(() => clearSubscriptions, [clearSubscriptions]);

	return (
		<Editor
			key={props.example.id}
			enableModalProvider
			projectName={`flowmotion-${example.id}`}
			project={example.project}
			height={height}
			build={{ state: 'uninitiated' }}
			storySetups={example.storySetups}
			onMount={handleMount}
		/>
	);
}

export default memo(FlowEditorPane);
