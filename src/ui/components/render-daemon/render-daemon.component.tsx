import { useEffect, useState } from 'react';
import { RenderEngine } from '../../services/render-engine/render-engine';
import { useStory } from '../../state-managers/story/story.store';
import { ReactFlowInstance } from 'reactflow';

export default function (props: {
	renderEngine: RenderEngine;
	reactFlowInstance: ReactFlowInstance;
}) {
	const [drawCount, setDrawCount] = useState(0);
	const {
		consumeRenderToken,
		flowPlayerProps,
		isFinished,
		isHydrated,
		returnRenderToken,
		setRuntimeError,
	} = useStory((state) => ({
		consumeRenderToken: state.consumeRenderToken,
		returnRenderToken: state.returnRenderToken,
		flowPlayerProps: state.flowPlayerProps,
		isHydrated: state.isHydrated,
		isFinished: state.isFinished,
		setRuntimeError: state.setRuntimeError,
	}));
	useEffect(() => {
		if (!isHydrated) {
			return;
		}
		if (isFinished) {
			return;
		}
		if (flowPlayerProps.mode !== 'auto') {
			return;
		}
		(async () => {
			const token = consumeRenderToken();
			if (!token) {
				console.error('Tried rendering but no token');
				return;
			}
			await props.renderEngine.render(token);
			returnRenderToken(token);
			setDrawCount((currentCount) => currentCount + 1);
		})().catch(setRuntimeError);
	}, [drawCount, flowPlayerProps.mode, isFinished, isHydrated]);

	return <></>;
}
