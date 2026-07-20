import type {Partition} from '$lib/types.js';
import type {
    BulkImport,
    LionWebVersionType,
    ListRepositoriesResponse,
    RepositoryConfiguration
} from '@lionweb/server-shared';
import {RepositoryClient, TransferFormat} from '@lionweb/server-http-client';
import type {LionWebJsonChunk, LionWebJsonNode} from '@lionweb/json';
import {getNodeName} from '$lib/utils/noderendering.js';

const CLIENT_ID = 'lionWebRepoAdminUI';
const hostname  = 'localhost'
const 	port = '3005'

export async function getRepositories(): Promise<ListRepositoriesResponse> {
	const client = new RepositoryClient({clientId: CLIENT_ID, hostname: "localhost", port: "3005", repository: "default"});
	const response = await client.dbAdmin.listRepositories();
	if (response.body.success) {
		return response.body;
	} else {
		console.error('Error fetching repositories:', response.body.messages);
		throw new Error(`Failed to fetch repositories: ${response.body.messages}`);
	}
}

export async function createRepository(
	repositoryConfiguration: RepositoryConfiguration
): Promise<void> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryConfiguration.name
	});
	const response = await client.dbAdmin.createRepository(
		repositoryConfiguration.name,
		repositoryConfiguration.history,
		repositoryConfiguration.lionweb_version as LionWebVersionType
	);
	if (response.body.success) {
		return;
	} else {
		console.error('Error creating repositories:', response.body.messages);
		throw new Error(`Failed to create repositories: ${response.body.messages}`);
	}
}

export async function deleteRepository(repositoryName: string): Promise<void> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryName
	});
	const response = await client.dbAdmin.deleteRepository(repositoryName);
	if (response.body.success) {
		return;
	} else {
		console.error('Error delete repositories:', response.body.messages);
		throw new Error(`Failed to delete repositories: ${response.body.messages}`);
	}
}

export async function listPartitionsIDs(repositoryName: string): Promise<string[]> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryName
	});
	const response = await client.bulk.listPartitions();
	if (response.body.success) {
		return response.body.chunk.nodes.map((node) => node.id);
	} else {
		console.error('Error listPartitions:', response.body.messages);
		throw new Error(`Failed to listPartitions: ${response.body.messages}`);
	}
}

export async function createPartition(
	repositoryName: string,
	chunk: LionWebJsonChunk
): Promise<Partition> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryName
	});
    client.timeout = 300_000;

	const rootNodes = chunk.nodes.filter((node) => node.parent === null);
	if (rootNodes.length !== 1) {
		throw new Error('Expected exactly one root node, got ' + rootNodes.length);
	}

	// Create a partition object with the available information
	const partition: Partition = {
		id: rootNodes[0].id
	};

	const bulkImport: BulkImport = {
		nodes: chunk.nodes,
		attachPoints: []
	};
	const storeResponse = await client.additional.bulkImport(bulkImport, TransferFormat.JSON, false);
	if (!storeResponse.body.success) {
		throw new Error(
			JSON.stringify(storeResponse.body.messages || 'Failed to store the partition data')
		);
	}

	return partition;
}

export async function createPartitions(
	repositoryName: string,
	chunks: LionWebJsonChunk[]
): Promise<void> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryName
	});
    client.timeout = 300_000;

	const bulkImport: BulkImport = {
		nodes: [],
		attachPoints: []
	};
	for (const chunk of chunks) {
		const rootNodes = chunk.nodes.filter((node) => node.parent === null);
		if (rootNodes.length !== 1) {
			throw new Error('Expected exactly one root node, got ' + rootNodes.length);
		}
		bulkImport.nodes = bulkImport.nodes.concat(chunk.nodes);
	}
	console.log('createPartitions: bulk import nodes.length=', bulkImport.nodes.length);
	const storeResponse = await client.additional.bulkImport(bulkImport, TransferFormat.JSON, true);
	console.log('createPartitions: bulk import completed', storeResponse);
	if (!storeResponse.body.success) {
		throw new Error(
			JSON.stringify(storeResponse.body.messages || 'Failed to store the partition data')
		);
	}
}

export async function deletePartition(repositoryName: string, partitionId: string): Promise<void> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryName
	});
	const response = await client.bulk.deletePartitions([partitionId]);

	if (!response.body.success) {
		throw new Error(JSON.stringify(response.body.messages || 'Failed to delete partition'));
	}
}

export async function loadPartition(
	repositoryName: string,
	partitionId: string
): Promise<LionWebJsonChunk> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryName
	});
    client.timeout = 300_000;
	const response = await client.bulk.retrieve([partitionId]);

	if (!response.body.success) {
		throw new Error(JSON.stringify(response.body.messages || 'Failed to load partition'));
	}

	console.log('Load partition response:', response.body);

	return response.body.chunk;
}

export async function loadPartitionNames(
	repositoryName: string,
	partitionIds: string[]
): Promise<Map<string, string | undefined>> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryName
	});
    client.timeout = 300_000;
	const response = await client.bulk.retrieve(partitionIds, 0);

	if (!response.body.success) {
		throw new Error(
			JSON.stringify(response.body.messages || 'Failed to load partition shallow data')
		);
	}

	const partitionNames = new Map<string, string | undefined>();
	response.body.chunk.nodes.forEach((node) => {
		const name = getNodeName(node);
		partitionNames.set(node.id, name);
	});
	return partitionNames;
}

export async function loadShallowPartitions(
	repositoryName: string,
	partitionIds: string[]
): Promise<Map<string, LionWebJsonNode>> {
	const client = new RepositoryClient({
		clientId: CLIENT_ID,
		hostname: 'localhost',
		port: '3005',
		repository: repositoryName
	});
	const response = await client.bulk.retrieve(partitionIds, 0);

	if (!response.body.success) {
		throw new Error(
			JSON.stringify(response.body.messages || 'Failed to load partition shallow data')
		);
	}

	const partitionData = new Map<string, LionWebJsonNode>();
	response.body.chunk.nodes.forEach((node) => {
		partitionData.set(node.id, node);
	});
	return partitionData;
}

export async function downloadRepositoryAsZip(
	repositoryName: string,
	progressCallback: (current: number, total: number) => void
): Promise<Blob> {
	// Get list of all partitions
	const existingPartitionsIDs = await listPartitionsIDs(repositoryName);
	const totalPartitions = existingPartitionsIDs.length;

	// Create a new JSZip instance
	const JSZip = (await import('jszip')).default;
	const zip = new JSZip();

	// Download each partition
	for (let i = 0; i < totalPartitions; i++) {
		const existingPartitionID = existingPartitionsIDs[i];
		progressCallback(i, totalPartitions);

		// Load the partition data
		const partitionData = await loadPartition(repositoryName, existingPartitionID);

		// Add it to the zip file
		zip.file(`${existingPartitionID}.json`, JSON.stringify(partitionData, null, 2));
	}

	// Final progress update
	progressCallback(totalPartitions, totalPartitions);

	// Generate the zip file
	return await zip.generateAsync({ type: 'blob' });
}

export async function uploadRepositoryFromZip(
	file: File,
	repositoryName: string,
	progressCallback: (current: number, total: number) => void,
	handleExistingPartition: (partitionId: string) => Promise<'skip' | 'replace'>
): Promise<void> {
	const JSZip = (await import('jszip')).default;
	const zip = await JSZip.loadAsync(file);

	// Process each file in the zip
	const files = Object.values(zip.files).filter(
		(zipFile): zipFile is import('jszip').JSZipObject => !zipFile.dir
	);
	const total = files.length;

	const existingPartitionsIDs = await listPartitionsIDs(repositoryName);

	const BLOCK_SIZE = 100;
	let toStore = [];
	for (let i = 0; i < files.length; ) {
		let endIndex = i + BLOCK_SIZE - 1;
		if (endIndex > files.length - 1) {
			endIndex = files.length - 1;
		}
		console.log(`uploadRepositoryFromZip i=${i} endIndex=${endIndex} files.length=${files.length}`);

		progressCallback(i, total);
		for (let j = i; j <= endIndex; j++) {
			const zipFile = files[j];

			const content = await zipFile.async('string');
			const partitionData: LionWebJsonChunk = JSON.parse(content);

			const rootsInPartitionData = partitionData.nodes.filter(
				(node: LionWebJsonNode) => node.parent == null
			);
			if (rootsInPartitionData.length != 1) {
				throw new Error('Not a valid partition. Roots found: ' + rootsInPartitionData.length);
			}

			const partitionID = rootsInPartitionData[0].id;
			const partitionExists = existingPartitionsIDs.includes(partitionID);
			let skip = false;
			if (partitionExists) {
				const action = await handleExistingPartition(partitionID);
				if (action === 'skip') {
					skip = true;
				} else if (action === 'replace') {
					await deletePartition(repositoryName, partitionData.nodes[0].id);
				} else {
					throw new Error('Unexpected situation');
				}
			}
			if (!skip) {
				toStore.push(partitionData);
			}
		}
		if (toStore.length > 0) {
			console.log(`calling create partitions with toStore.length=${toStore.length}`);
			await createPartitions(repositoryName, toStore);
			toStore = [];
		}
		i = endIndex + 1;
	}

	// Final progress update
	progressCallback(total, total);
}

// TODO remove this trivial function
export async function getPartitionsCount(repositoryName: string): Promise<number> {
	try {
		const partitionsIDs = await listPartitionsIDs(repositoryName);
		return partitionsIDs.length;
	} catch (e) {
		console.error('Error getting partitions count:', e);
		throw new Error(
			`Failed to get partitions count: ${e instanceof Error ? e.message : 'Unknown error'}`
		);
	}
}
