/**
 * Type definitions for the properties of all model Svelte components.
 */
import type { RepositoryConfiguration } from '@lionweb/server-shared';

export type CreateRepositoryProps = {
	show: boolean;
	onClose: () => void;
	onCreate: (repository: RepositoryConfiguration) => Promise<void>;
};

export type DeleteConfirmationProps = {
	show: boolean;
	repository: RepositoryConfiguration | null;
	onClose: () => void;
	onConfirm: () => Promise<void>;
};

export type DownloadProgressProps = {
	show: boolean;
	progress: { current: number; total: number };
};

export type ExistingPartitionProps = {
	show: boolean;
	partitionId: string | null;
	onAction: (action: 'skip' | 'replace', applyAll: boolean) => void;
};

export type UploadProgressProps = {
	show: boolean;
	progress: { current: number; total: number };
};
