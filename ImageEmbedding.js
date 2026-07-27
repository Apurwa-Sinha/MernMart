/**
 * Image embedding helper for visual search.
 *
 * Uses the Hugging Face Inference API's image-feature-extraction task
 * to convert a product/search image into a numeric vector. Requires:
 *
 *   HUGGINGFACE_API_KEY=hf_xxx   (in your .env)
 *
 * Get a free key at https://huggingface.co/settings/tokens
 *
 * Model used: google/vit-base-patch16-224-in21k
 * (a general-purpose vision transformer; swap for a CLIP variant if you
 * want embeddings that also align with text queries later on)
 */

const HF_MODEL = 'google/vit-base-patch16-224-in21k';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

/**
 * Sends an image buffer to the Hugging Face Inference API and returns
 * a flat numeric embedding vector.
 * @param {Buffer} imageBuffer - raw image bytes (e.g. from fs.readFileSync or product.photo.data)
 * @returns {Promise<number[]>}
 */
exports.getImageEmbedding = async (imageBuffer) => {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is not set in your .env file');
  }

  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/octet-stream',
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Hugging Face API error (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  // The feature-extraction task can return a nested structure
  // (e.g. one vector per patch/token). We flatten and average-pool
  // down to a single fixed-length vector per image.
  const vector = flattenToSingleVector(result);
  return vector;
};

/**
 * Collapses a nested array output down to a single 1D vector by
 * averaging across the outer dimension(s), so every image ends up
 * with a vector of the same length regardless of the model's raw
 * output shape.
 */
function flattenToSingleVector(data) {
  if (!Array.isArray(data)) {
    throw new Error('Unexpected embedding response shape from Hugging Face');
  }

  // Already a flat array of numbers
  if (typeof data[0] === 'number') {
    return data;
  }

  // Nested arrays (e.g. [ [ [...], [...] ] ]) — recursively unwrap
  // the outermost dimension until we hit rows of numbers, then average.
  let rows = data;
  while (Array.isArray(rows[0]) && Array.isArray(rows[0][0])) {
    rows = rows[0];
  }
  if (Array.isArray(rows[0])) {
    rows = rows[0];
  }

  const length = rows[0].length;
  const sums = new Array(length).fill(0);
  for (const row of rows) {
    for (let i = 0; i < length; i++) {
      sums[i] += row[i];
    }
  }
  return sums.map((sum) => sum / rows.length);
}

/**
 * Cosine similarity between two equal-length vectors.
 * Returns a value between -1 and 1 (1 = identical direction).
 */
exports.cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
