import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  time: string;
  ping: number;
  speed: number;
}

export function NetworkGraph({ isOptimizing }: { isOptimizing: boolean }) {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    // Initialize with some data
    const initialData = Array.from({ length: 20 }).map((_, i) => ({
      time: i.toString(),
      ping: Math.floor(Math.random() * 50) + 50,
      speed: Math.floor(Math.random() * 20) + 10,
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData.slice(1)];
        const lastPing = prevData[prevData.length - 1].ping;
        const lastSpeed = prevData[prevData.length - 1].speed;

        let nextPing = lastPing + (Math.random() * 10 - 5);
        let nextSpeed = lastSpeed + (Math.random() * 4 - 2);

        if (isOptimizing) {
          nextPing = Math.max(8, nextPing - Math.random() * 5);
          nextSpeed = Math.min(250, nextSpeed + Math.random() * 10);
        } else {
          nextPing = Math.min(100, Math.max(40, nextPing + (Math.random() * 10 - 4)));
          nextSpeed = Math.max(5, Math.min(50, nextSpeed + (Math.random() * 6 - 4)));
        }

        newData.push({
          time: new Date().toLocaleTimeString([], { hour12: false, second: '2-digit', minute: '2-digit' }),
          ping: Math.round(nextPing),
          speed: Math.round(nextSpeed),
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOptimizing]);

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis yAxisId="left" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
          <YAxis yAxisId="right" orientation="right" hide />
          <Tooltip
            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
            itemStyle={{ color: '#f8fafc' }}
            cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="ping"
            stroke="#22d3ee"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
            name="Ping (ms)"
            style={{ filter: 'drop-shadow(0px 4px 8px rgba(34, 211, 238, 0.3))' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="speed"
            stroke="#a78bfa"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
            name="Speed (Mbps)"
            style={{ filter: 'drop-shadow(0px 4px 8px rgba(167, 139, 250, 0.3))' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
