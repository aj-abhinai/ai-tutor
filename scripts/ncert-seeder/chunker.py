# Text chunking for LLM processing
"""
Chunker - Split text into token-based chunks for LLM processing.
"""
import tiktoken
from typing import List


def count_tokens(text: str, model: str = "cl100k_base") -> int:
    """Count tokens in text using tiktoken."""
    try:
        enc = tiktoken.get_encoding(model)
        return len(enc.encode(text))
    except Exception:
        return len(text) // 4


def chunk_text(text: str, max_tokens: int = 1500, overlap: int = 100) -> List[str]:
    """
    Split text into chunks of approximately max_tokens.
    Uses simple paragraph-based splitting with overlap for context.
    """
    if not text:
        return []
    
    token_count = count_tokens(text)
    if token_count <= max_tokens:
        return [text]
    
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_tokens = 0
    
    for para in paragraphs:
        para_tokens = count_tokens(para)
        
        if current_tokens + para_tokens > max_tokens and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            
            if overlap > 0 and len(current_chunk) > 1:
                overlap_text = "\n\n".join(current_chunk[-2:])
                overlap_tokens = count_tokens(overlap_text)
                if overlap_tokens < overlap:
                    current_chunk = [overlap_text]
                    current_tokens = overlap_tokens
                else:
                    current_chunk = []
                    current_tokens = 0
            else:
                current_chunk = []
                current_tokens = 0
        
        current_chunk.append(para)
        current_tokens += para_tokens
    
    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
    
    return chunks


def chunk_subtopic(subtopic: dict, max_tokens: int = 1500) -> List[dict]:
    """
    Chunk a subtopic's content while preserving metadata.
    Returns list of chunk dicts with subtopic context.
    """
    content = subtopic.get("content", "")
    if not content:
        return []
    
    chunks = chunk_text(content, max_tokens)
    
    result = []
    for i, chunk in enumerate(chunks):
        result.append({
            "chapter_id": subtopic.get("chapter_id"),
            "chapter_title": subtopic.get("chapter_title"),
            "topic_id": subtopic.get("topic_id"),
            "topic_title": subtopic.get("topic_title"),
            "subtopic_id": subtopic.get("subtopic_id"),
            "subtopic_title": subtopic.get("subtopic_title"),
            "chunk_index": i,
            "total_chunks": len(chunks),
            "content": chunk,
            "content_tokens": count_tokens(chunk),
        })
    
    return result


if __name__ == "__main__":
    sample = "This is a paragraph.\n\n" * 500
    chunks = chunk_text(sample, max_tokens=100)
    print(f"Created {len(chunks)} chunks")
    for i, c in enumerate(chunks):
        print(f"Chunk {i}: {count_tokens(c)} tokens")
