from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime

app = FastAPI(title="Panara Real-Data API")

# Mengaktifkan CORS agar frontend React bisa menembak API Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_clean_data():
    # Membaca berkas Excel asli Anda
    df = pd.read_excel('database_pangan_indonesia.xlsx')
    df['Tanggal'] = pd.to_datetime(df['Tanggal'], dayfirst=True)
    df['Harga'] = pd.to_numeric(df['Harga'], errors='coerce')
    df = df.dropna(subset=['Harga'])
    return df

@app.get("/api/provinsi")
def get_list_provinsi():
    """Mengambil daftar semua provinsi yang ada di dataset Anda"""
    df = load_clean_data()
    daftar_provinsi = sorted(df['Provinsi'].dropna().unique().tolist())
    return {"provinsi": daftar_provinsi}

@app.get("/api/pangan")
def get_dashboard_data(provinsi: str):
    df = load_clean_data()
    
    # Filter data berdasarkan Provinsi pilihan user dari dataset
    df_prov = df[df['Provinsi'].str.lower() == provinsi.lower()]
    
    if df_prov.empty:
        return {"status": "error", "message": f"Data untuk provinsi {provinsi} tidak ditemukan"}
        
    daftar_komoditas = df_prov['Komoditas'].unique()
    response_commodities = []
    response_trends = {}
    
    total_naik = 0
    total_turun = 0
    
    for name in daftar_komoditas:
        df_local = df_prov[df_prov['Komoditas'] == name].sort_values(by='Tanggal')
        if df_local.empty:
            continue
            
        latest_row = df_local.iloc[-1]
        harga_sekarang = int(latest_row['Harga'])
        tanggal_terakhir = latest_row['Tanggal']
        
        # Penentuan satuan otomatis
        satuan = "liter" if "minyak" in name.lower() else "kg"
        
        # Hitung perubahan harga dibanding hari sebelumnya
        change_pct = 0.0
        if len(df_local) > 1:
            harga_kemarin = df_local.iloc[-2]['Harga']
            if harga_kemarin > 0:
                change_pct = round(((harga_sekarang - harga_kemarin) / harga_kemarin) * 100, 1)
                
        if change_pct > 0:
            total_naik += 1
        elif change_pct < 0:
            total_turun += 1
            
        # Untuk perbandingan mode petani, ambil rata-rata harga komoditas tersebut secara nasional
        harga_nasional = int(df[df['Komoditas'] == name]['Harga'].mean())
        
        response_commodities.append({
            "name": name,
            "price": harga_sekarang,
            "unit": satuan,
            "change": change_pct,
            "icon": "🌾" if "beras" in name.lower() else "🌶️" if "cabai" in name.lower() else "🧅" if "bawang" in name.lower() else "📦",
            "priceNational": harga_nasional
        })
        
        # --- ALGORITMA PREDIKSI TREN LINEAR 7 HARI TERAKHIR (3 HARI KE DEPAN) ---
        df_hist_30 = df_local.tail(30)
        chart_data = []
        for _, r in df_hist_30.iterrows():
            chart_data.append({
                "date": r['Tanggal'].strftime('%d/%m'),
                "price": int(r['Harga']),
                "isPrediction": False
            })
            
        df_trend_7 = df_local.tail(7)
        if len(df_trend_7) > 1:
            perubahan_total = df_trend_7['Harga'].iloc[-1] - df_trend_7['Harga'].iloc[0]
            rata_perubahan_harian = perubahan_total / (len(df_trend_7) - 1)
        else:
            rata_perubahan_harian = 0.0
            
        current_pred_price = harga_sekarang
        for i in range(1, 4):
            next_date = tanggal_terakhir + pd.Timedelta(days=i)
            current_pred_price += rata_perubahan_harian
            chart_data.append({
                "date": next_date.strftime('%d/%m'),
                "price": int(max(0, current_pred_price)),
                "isPrediction": True
            })
            
        response_trends[name] = chart_data

    return {
        "update_timestamp": datetime.now().strftime("%A, %d %B %Y - %H:%M WIB"),
        "stats": {
            "total_commodities": len(response_commodities),
            "current_location": provinsi,
            "price_up": total_naik,
            "price_down": total_turun
        },
        "commodities": response_commodities,
        "trends": response_trends
    }
