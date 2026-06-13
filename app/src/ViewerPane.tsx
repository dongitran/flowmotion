import { Playground } from '@dongtran/flowmotion';
import type { BuiltFlowBuild, FlowExample } from './types';

export default function ViewerPane(props: {
	example: FlowExample;
	build: BuiltFlowBuild;
	height: string;
}) {
	return (
		<Playground
			key={`${props.example.id}-${props.build.artificats.projectVersion}`}
			enableModalProvider
			projectName={`flowmotion-${props.example.id}`}
			height={props.height}
			build={props.build}
			storySetups={props.example.storySetups}
			viewFlags={{ resolution: 'medium' }}
		/>
	);
}
