import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Card } from "./ui/card";

interface PriceChartProps {
  title: string;
  data: Array<{
    date: string;
    price: number;
    isPrediction: boolean;
  }>;
}

export function PriceChart({ title, data }: PriceChartProps) {
  if (!data || data.length === 0) return null;

  // Mencari titik potong/sambungan antara data historis terakhir dan awal prediksi
  const lastHistoricalIndex = data.map(d => d.isPrediction).indexOf(true) - 1;
  const targetHistoricalDot = lastHistoricalIndex >= 0 ? data[lastHistoricalIndex] : null;

  const chartData = data.map((item, idx) => ({
    ...item,
    hargaHistoris: !item.isPrediction ? item.price : (idx === lastHistoricalIndex + 1 ? item.price : undefined),
    hargaPrediksi: item.isPrediction || idx === lastHistoricalIndex ? item.price : undefined
  }));

  return (
    <Card className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-6">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={(value) => `${value / 1000}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            formatter={(value: any, name: any) => [
              `Rp ${Number(value).toLocaleString('id-ID')}`, 
              name === "hargaHistoris" ? "Harga Pasar Riil" : "Prediksi Masa Depan"
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          
          {/* Sesuai Spesifikasi Panara: Hijau Tua (#16a34a) Solid untuk Historis */}
          <Line type="monotone" dataKey="hargaHistoris" name="Harga Historis (30 Hari)" stroke="#16a34a" strokeWidth={3} dot={false} connectNulls={true} />
          
          {/* Sesuai Spesifikasi Panara: Kuning/Amber (#f59e0b) Putus-putus '8 4' Opacity 60% */}
          <Line type="monotone" dataKey="hargaPrediksi" name="Prediksi Harga (3 Hari)" stroke="#f59e0b" strokeWidth={3} strokeDasharray="8 4" strokeOpacity={0.6} dot={false} connectNulls={true} />

          {/* Sesuai Spesifikasi Panara: 1 Titik besar di tanggal hari ini */}
          {targetHistoricalDot && (
            <ReferenceDot x={targetHistoricalDot.date} y={targetHistoricalDot.price} r={6} fill="#16a34a" stroke="#ffffff" strokeWidth={3} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
