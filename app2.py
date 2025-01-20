from flask import Flask, request, render_template, jsonify
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import create_retrieval_chain, LLMChain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv
import os

# Memuat variabel lingkungan
load_dotenv()

# Perbaikan: _name_ digunakan di sini, bukan name
app = Flask(__name__)

# Inisialisasi penyimpanan vektor
penyimpanan_vektor = Chroma(
    persist_directory="data_mobil", 
    embedding_function=HuggingFaceEmbeddings(model_name="sentence-transformers/bert-base-nli-max-tokens")
)
pencari = penyimpanan_vektor.as_retriever(search_type="similarity", search_kwargs={"k": 10})

# Inisialisasi LLM dengan model gemini-1.5-flash
model_llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7, max_tokens=500, timeout=30)

# Prompt untuk chain
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
        MessagesPlaceholder(variable_name="context"),
        HumanMessagePromptTemplate.from_template("{question}")
    ]
)

# Memori percakapan untuk menyimpan riwayat
memori = ConversationBufferMemory(memory_key="context", return_messages=True)

# Membuat LLMChain dengan memori untuk percakapan
rantai_percakapan = LLMChain(
    llm=model_llm,
    prompt=prompt,
    verbose=True,
    memory=memori
)

@app.route("/")
def beranda():
    return render_template("chat.html")

@app.route("/tanya", methods=["POST"])
def tanya():
    pertanyaan = request.json.get("query")
    print(f"Pertanyaan diterima: {pertanyaan}")  # Debugging
    try:
        if pertanyaan and pertanyaan.strip():
            jawaban = rantai_percakapan.run(question=pertanyaan.strip())
            jawaban_bersih = jawaban.replace("*", "")
            print(f"Jawaban yang dikirim: {jawaban_bersih}")  # Debugging
            return jsonify({"answer": jawaban_bersih})
        else:
            print("Pertanyaan kosong atau tidak valid.")  # Debugging
            return jsonify(error="Pertanyaan tidak valid atau kosong"), 400
    except Exception as e:
        print(f"Error: {e}")  # Debugging
        return jsonify(error="Terjadi kesalahan saat memproses pertanyaan."), 500

# Perbaikan: _name_ == "_main" digunakan di sini, bukan _name == "main"
if __name__ == "__main__":
    app.run(debug=True)
