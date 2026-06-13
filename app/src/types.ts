import type { EditorProps, PlaygroundProps } from '@dongtran/flowmotion/dist/types';

export type FlowProject = EditorProps['project'];
export type FlowStorySetups = PlaygroundProps['storySetups'];
export type FlowBuild = NonNullable<EditorProps['build']>;
export type BuiltFlowBuild = PlaygroundProps['build'];

export type FlowExample = {
	id: string;
	title: string;
	summary: string;
	project: FlowProject;
	storySetups: FlowStorySetups;
};

export type BuildStatus = 'waiting' | 'processing' | 'built' | 'errored';
