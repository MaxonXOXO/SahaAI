import { getEmbedding } from '../src/shared/lib/aiClient.js';

async function testEmbeddingFlow() {
  console.log('--- 1. Testing getEmbedding() ---');
  const sampleText = 'kept keys in blue bag';
  try {
    const vector = await getEmbedding(sampleText);
    console.log('Embedding successfully generated!');
    console.log('Vector length:', vector.length);
    console.log('First 5 elements:', vector.slice(0, 5));
    
    if (vector.length !== 768) {
      throw new Error(`Expected vector dimension 768, got ${vector.length}`);
    }
    console.log('✅ Dimension match 768 verified.');
  } catch (err) {
    console.error('❌ Embedding test failed:', err);
    process.exit(1);
  }
}

testEmbeddingFlow();
