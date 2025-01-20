from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import os

load_dotenv()

direktori_data = "data_mobil"
berkas_dataset = [file for file in os.listdir(direktori_data) if file.endswith('.pdf')]

semua_halaman = []

for berkas_dataset_file in berkas_dataset:
    try:
        jalur_berkas = os.path.join(direktori_data, berkas_dataset_file)
        pemuat_pdf = PyPDFLoader(jalur_berkas)
        data_dokumen = pemuat_pdf.load()
        semua_halaman.extend(data_dokumen)
        print(f"Berhasil memuat {len(data_dokumen)} halaman dari {berkas_dataset_file}")
    except Exception as error:
        print(f"Terjadi kesalahan saat memuat file PDF {berkas_dataset_file}: {error}")

if semua_halaman:
    pemisah_dokumen = RecursiveCharacterTextSplitter(chunk_size=1000)
    dokumen_terpisah = pemisah_dokumen.split_documents(semua_halaman)
    print(f"Total bagian dokumen yang dihasilkan: {len(dokumen_terpisah)}")
else:
    print("Tidak ada data yang ditemukan untuk diproses.")

model_embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/bert-base-nli-max-tokens")

penyimpanan_vektor = Chroma.from_documents(
    documents=dokumen_terpisah,
    embedding=model_embedding,
    persist_directory="hasil_ciwang dan kharomah"
)

alat_pencari = penyimpanan_vektor.as_retriever(search_type="similarity", search_kwargs={"k": 10})
print("Penyimpanan vektor berhasil dibuat dan disimpan.")

model_bahasa = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, max_tokens=None, timeout=None)

instruksi_sistem = (
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
    "\n\n"
    "{context}"
)

template_prompt_chat = ChatPromptTemplate.from_messages(
    [
        ("system", instruksi_sistem),
        ("human", "{input}"),
    ]
)

rantai_qa = create_stuff_documents_chain(model_bahasa, template_prompt_chat)
rantai_pencarian = create_retrieval_chain(alat_pencari, rantai_qa)

# Sample query
sample_query = "mengapa mobil saya tidak mau dinyalakan saat hujan?, mengapa lampu depan mobil tidak menyala, Mobil  mengeluarkan  bunyi  mendengung  dari  transmisi  saat  melaju, kira-kira kerusakan apa yang terjadi?, kenapa ya mobil saya mengeluarkan bau bensin yang menyengat dari knalpot?, Terdengar suara dengung dari area belakang saat mobil dalam kecepatan tinggi mengapa seperti itu dan bagaimana solusi untuk memperbaikinya. "
jawaban_terakhir = rantai_pencarian.invoke({"input": sample_query})
print("Jawaban yang diberikan:", jawaban_terakhir["answer"])

dokumen_terambil = alat_pencari.invoke(sample_query)

embedding_query = model_embedding.embed_query(sample_query)

kemiripan = []
for dokumen in dokumen_terambil:
    embedding_dokumen = model_embedding.embed_query(dokumen.page_content)
    
    nilai_kemiripan = cosine_similarity([embedding_query], [embedding_dokumen])[0][0]
    
    kemiripan.append(nilai_kemiripan)

kemiripan = sorted(kemiripan, key=lambda x: x, reverse=True)

# Display only the similarity scores
print("Skor kemiripan:")
for skor in kemiripan:
    print(f"{skor:.4f}")
