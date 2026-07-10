import api from '../api/axios';

function readEntry(entry, pathPrefix = '') {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => {
        resolve([{ file, relativePath: pathPrefix + file.name }]);
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const allEntries = [];

      const readBatch = () => {
        reader.readEntries(async (batchEntries) => {
          if (batchEntries.length === 0) {
            const nested = await Promise.all(
              allEntries.map((e) => readEntry(e, pathPrefix + entry.name + '/'))
            );
            resolve(nested.flat());
          } else {
            allEntries.push(...batchEntries);
            readBatch();
          }
        });
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

export async function getFilesFromDataTransferItems(items) {
  const entries = Array.from(items)
    .map((item) => (item.webkitGetAsEntry ? item.webkitGetAsEntry() : null))
    .filter(Boolean);

  const results = await Promise.all(entries.map((entry) => readEntry(entry)));
  return results.flat();
}

export function getFilesFromFileList(fileList) {
  return Array.from(fileList).map((file) => ({
    file,
    relativePath: file.webkitRelativePath || '',
  }));
}

export async function uploadFileBatch({ items, parentFolder, onProgress }) {
  const formData = new FormData();
  const relativePaths = [];

  for (const { file, relativePath } of items) {
    formData.append('files', file);
    relativePaths.push(relativePath);
  }
  formData.append('relativePaths', JSON.stringify(relativePaths));
  if (parentFolder) formData.append('parentFolder', parentFolder);

  const { data } = await api.post('/files/upload-batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => onProgress?.(Math.round((evt.loaded * 100) / evt.total)),
  });

  return data.data;
}
