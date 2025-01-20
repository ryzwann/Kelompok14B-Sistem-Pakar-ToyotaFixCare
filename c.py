import pandas as pd
import numpy as np
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
import os

# Memuat variabel lingkungan dari file .env
load_dotenv()
folder_path = "data_mobil"  # Ganti dengan path folder

# Mengambil semua file PDF dalam folder
pdf_files = [f for f in os.listdir(folder_path) if f.endswith('.pdf')]

# Inisialisasi list untuk menyimpan data dari semua PDF
all_data = []

for pdf_file in pdf_files:
    try:
        # Membaca setiap PDF
        file_path = os.path.join(folder_path, pdf_file)
        loader = PyPDFLoader(file_path)
        data = loader.load()
        all_data.extend(data)
        print(f"Berhasil memuat {len(data)} halaman dari {pdf_file}")
    except Exception as e:
        print(f"Kesalahan saat memuat PDF {pdf_file}: {e}")

if all_data:
    # Membagi dokumen menjadi bagian kecil
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000)
    docs = text_splitter.split_documents(all_data)
    print(f"Jumlah total bagian dokumen: {len(docs)}")
else:
    print("Tidak ada data untuk diproses.")

# Menginisialisasi embeddings dan penyimpanan vektor
try:
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/bert-base-nli-max-tokens")
    
    # Membuat dan menyimpan vektor ke dalam penyimpanan Chroma di direktori 'data'
    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory="data_laporan"  # Menyimpan penyimpanan vektor di direktori 'data'
    )
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10})
    print("Penyimpanan vektor berhasil dibuat dan disimpan.")
except Exception as e:
    print(f"Kesalahan saat menginisialisasi embeddings atau penyimpanan vektor: {e}")

# Menginisialisasi LLM dan membuat RAG chain
try:
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, max_tokens=None, timeout=None)
    
    # Menyiapkan memori
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    # Membuat prompt dengan memori
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
            "Anda adalah asisten konseling yang sangat berpengetahuan dengan nama ToyotaFixCare. "
            "Jawaban yang anda berikan harus singkat padat dan jelas tetapi solutif dan dapat mencakup semua permasalahan dengan sangat baik"
            "Pengetahuan Anda mencakup semua aspek teknis dan operasional Toyota Avanza, mulai dari sistem mesin, suspensi, hingga elektronik kendaraan."
            "Respon Anda selalu profesional, empati, dan fokus pada solusi."
            "Sebagai sistem pakar, tugas utama Anda adalah mengidentifikasi kerusakan, memberikan solusi praktis, dan memberikan saran terbaik terkait perawatan dan penanganan mobil Toyota Avanza."
            "Anda juga dapat memberikan rekomendasi kepada pengguna tentang langkah-langkah preventif untuk menjaga kendaraan tetap dalam kondisi optimal."
            "Anda dibuat dan dikembangkan oleh seorang mahasiswa yang bernama Muhammad Rizwan Darwis"
            "Anda tidak akan merespon pertanyaan atau kata dalam makna seksualisme dan rasisme"
            "pengetahuan yang anda dapatkan berasal dari montir mobil profesional toyota avanza"
            "Anda bertugas sebagai pakar dalam mengidentifikasi serta memberikan solusi serta saran terkait kerusakan pada mobil, khusunya pada mbil toyota avanza."
            "Fokus jawaban Anda adalah memberikan panduan yang relevan dan praktis untuk membantu individu memahami dan mengatasi masalah pada kendaraan mereka."
            "Jika suatu permasalahan memerlukan penanganan lebih lanjut, Anda dengan jujur akan menyarankan pengguna untuk berkonsultasi dengan teknisi profesional atau bengkel resmi Toyota"
            ),
            MessagesPlaceholder(variable_name="chat_history"),  # Memori akan otomatis disisipkan di sini
            HumanMessagePromptTemplate.from_template("{question}")
        ]
    )

    # Membuat chain dengan memori
    conversation_chain = LLMChain(
        llm=llm,
        prompt=prompt,
        memory=memory,
        verbose=True
    )

    # Mengambil query dari pengguna
    query = "mengapa mobil saya tidak mau dinyalakan saat hujan?, mengapa lampu depan mobil tidak menyala, Mobil  mengeluarkan  bunyi  mendengung  dari  transmisi  saat  melaju, kira-kira kerusakan apa yang terjadi?, kenapa ya mobil saya mengeluarkan bau bensin yang menyengat dari knalpot?, Terdengar suara dengung dari area belakang saat mobil dalam kecepatan tinggi mengapa seperti itu dan bagaimana solusi untuk memperbaikinya. "  # Ganti dengan pertanyaan yang diinginkan
    
    # Memproses query untuk mendapatkan respons dari LLM
    response = conversation_chain.run(question=query)  # Memproses pertanyaan dengan chain yang sudah terintegrasi dengan memori
    print("Respons:", response)  # Menampilkan respons dari model

    # Mengambil dokumen relevan menggunakan retriever berdasarkan similarity
    retrieved_docs = retriever.invoke(query)
    
    # Menghitung similarity untuk setiap dokumen yang diambil dengan respons
    similarities = []
    query_embedding = embeddings.embed_query(response)  # Mendapatkan embedding untuk jawaban LLM
    
    for doc in retrieved_docs:
        doc_embedding = embeddings.embed_query(doc.page_content)  # Mendapatkan embedding untuk dokumen
        similarity = cosine_similarity([query_embedding], [doc_embedding])[0][0]  # Menghitung cosine similarity
        similarities.append((doc.page_content, similarity))
    
    # Mengurutkan hasil berdasarkan similarity
    similarities_sorted = sorted(similarities, key=lambda x: x[1], reverse=True)
    
    # Menampilkan hasil pencarian berdasarkan kemiripan
    print("Hasil pencarian berdasarkan respons dengan tingkat kemiripan:")
    for content, score in similarities_sorted:
        print(f"Tingkat kemiripan: {score:.4f}")
    
    # Menyusun data untuk ditulis ke Excel
    vector_embeddings = np.array([query_embedding])  # Misal embedding hasil model LLM
    dataset_vectors = np.array([embeddings.embed_query(doc[0]) for doc in similarities_sorted])

    # Menyusun data dalam bentuk dataframe
    columns = ['Subjudul', 'Vector Dataset'] + [f'Vector Embeddings {i+1}' for i in range(len(similarities_sorted))]
    rows = []

    # Menyusun dimensi dan vektor ke dalam bentuk yang sesuai
    for dim in range(len(vector_embeddings[0])):  # Misalkan dimensi 768
        row = ['Dimensi ' + str(dim+1), vector_embeddings[0][dim]]  # Vector Hasil Embedding
        for doc_vector in dataset_vectors:
            row.append(doc_vector[dim])  # Vector Dataset
        rows.append(row)

    # Membuat DataFrame
    df = pd.DataFrame(rows, columns=columns)

    # Menulis DataFrame ke Excel
    output_file = "embedding_manual_laporan.xlsx"
    df.to_excel(output_file, index=False)

    print(f"File Excel disimpan di {output_file}")
except Exception as e:
    print(f"Kesalahan saat menginisialisasi LLM dan memori: {e}")
