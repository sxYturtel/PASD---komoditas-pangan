import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { CommodityCard } from "./components/CommodityCard";
import { StatCard } from "./components/StatCard";
import { PriceChart } from "./components/PriceChart";
import { Package, TrendingUp, AlertCircle, BarChart3 } from "lucide-react";

export default function App() {
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [role, setRole] = useState<'consumer' | 'farmer'>('consumer');
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommodityName, setSelectedCommodityName] = useState<string | null>(null);

  // 1. Ambil daftar Provinsi unik asli dari dataset Excel via Python
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/provinsi")
      .then((res) => res.json())
      .then((data) => {
        if (data.provinsi && data.provinsi.length > 0) {
          setAvailableProvinces(data.provinsi);
          setSelectedProvince(data.provinsi[0]); // Set default ke provinsi pertama di Excel
        }
      })
      .catch((err) => console.error("Gagal memuat daftar provinsi:", err));
  }, []);

  // 2. Ambil data komoditas & prediksi berdasarkan provinsi yang dipilih user
  useEffect(() => {
    if (!selectedProvince) return;
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/pangan?provinsi=${encodeURIComponent(selectedProvince)}`)
      .then((res) => res.json())
      .then((data) => {
        setApiData(data);
        setLoading(false);
        if (data.commodities && data.commodities.length > 0) {
          setSelectedCommodityName(data.commodities[0].name);
        }
      })
      .catch((err) => {
        console.error("Koneksi Backend Python Terputus:", err);
        setLoading(false);
      });
  }, [selectedProvince]);

  if (loading || !selectedProvince) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-green-600 font-semibold animate-pulse text-lg">
          PANARA: Memproses berkas Excel & memproyeksikan tren harga provinsi...
        </p>
      </div>
    );
  }

  const stats = apiData?.stats;
  const commodities = apiData?.commodities || [];
  const activeTrendData = selectedCommodityName ? apiData?.trends[selectedCommodityName] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        selectedProvince={selectedProvince} 
        onProvinceChange={setSelectedProvince} 
        availableProvinces={availableProvinces}
        role={role} 
        onRoleChange={setRole} 
        timestamp={apiData?.update_timestamp}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Komoditas" value={String(stats?.total_commodities)} icon={Package} />
          <StatCard title="Lokasi Saat Ini" value={stats?.current_location} icon={TrendingUp} />
          <StatCard title="Harga Naik" value={`${stats?.price_up} Komoditas`} icon={AlertCircle} />
          <StatCard title="Harga Turun" value={`${stats?.price_down} Komoditas`} icon={BarChart3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commodities.map((commodity: any) => (
              <CommodityCard
                key={commodity.name}
                name={commodity.name}
                price={commodity.price}
                unit={commodity.unit}
                change={commodity.change}
                icon={commodity.icon}
                onClick={() => setSelectedCommodityName(commodity.name)}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            {selectedCommodityName && activeTrendData && (
              <PriceChart 
                title={`Tren & Estimasi Harga: ${selectedCommodityName}`} 
                data={activeTrendData} 
              />
            )}
            <div className="mt-4 p-4 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-100">
              ⚠️ <b>Informasi Prediksi:</b> Proyeksi garis kuning putus-putus 3 hari ke depan dihitung secara otomatis menggunakan tren linier dari 7 hari terakhir pada dataset Anda.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
