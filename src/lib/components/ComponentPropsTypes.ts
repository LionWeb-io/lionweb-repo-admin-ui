/**
 * Type definitions for the properties of all Svelte components.
 */
import type { LionWebJsonChunk, LionWebJsonMetaPointer, LionWebJsonNode } from '@lionweb/json';
import { SvelteSet } from 'svelte/reactivity';

export type MetaPointerUIProps = {
	language: string;
	key: string;
	version: string;
};

export type LanguageUIProps = {
	language: string;
	version: string;
};

export type MonacoEditorProps = {
	value: string;
	language: string;
	theme: string;
	readOnly: boolean;
	height: string;
	onChange: (value: string) => void;
};

export type NodeDetailsProps = {
	node: LionWebJsonNode;
	handleNodeClick: (id: string) => void;
};

export type NodeNavigationProps = {
	chunk: LionWebJsonChunk;
	selectedNodeId: string | null;
	onNodeSelect: (nodeId: string) => void;
};

export type NodeTreeProps = {
	chunk: LionWebJsonChunk;
	expandedNodes: SvelteSet<string>;
	level?: number;
	nodeId?: string | null;
	selectedNodeId?: string | null;
	nodeClick?: (id: string) => void;
};

export type PartitionInfo = {
	id: string;
	name?: string;
	isLoaded?: boolean;
	data?: LionWebJsonChunk;
	metapointer?: LionWebJsonMetaPointer;
};

export type PartitionCardProps = {
	partition: PartitionInfo;
	onClick: (partition: { id: string }) => void;
	deleted: () => Promise<void>
};
