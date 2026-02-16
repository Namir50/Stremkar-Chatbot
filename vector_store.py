import chromadb
from sentence_transformers import SentenceTransformer

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

#creating persistent chromadb client
client = chromadb.PersistentClient(path="./chroma_db")

#creating or loading faq collection
collection = client.get_or_create_collection("streamkar_faq")

def add_faq(question, answer):
    embedding = embedding_model.encode(question).tolist()

    collection.add(
        documents = [answer],
        embeddings = [embedding],
        ids = [question]
    )
    
    #saving is automatic in newer ChromaDB versions

def delete_faq(question):
    collection.delete(ids=[question])

def get_all_faqs():
    results = collection.get()
    
    faqs = []
    for i in range(len(results["ids"])):
        faqs.append({
            "question": results["ids"][i],
            "answer": results["documents"][i]
        })
    return faqs

def retrieve_context(query):
    embedding = embedding_model.encode(query).tolist()

    results = collection.query(
        query_embeddings = [embedding]
    )

    docs = results.get("documents",[[]])[0]

    if not docs:
        return "No such faq"
    
    #combining multiple answers
    return "\n".join(docs)