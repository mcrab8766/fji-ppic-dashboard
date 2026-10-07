"use client";

import { FormEvent, useEffect, useState } from "react";

type Supply = {
  date: string;
  gentanCode: string;
  qty: number;
  remark: string;
};

export default function Home() {
  const [supplies, setSupplies] = useState<Supply[]>([]);

  const [date, setDate] = useState("");
  const [gentanCode, setGentanCode] = useState("");
  const [qty, setQty] = useState("");
  const [remark, setRemark] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Mengambil data dari FastAPI
  async function fetchSupplies() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/supplies"
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data");
      }

      const data = await response.json();

      setSupplies(data);
    } catch (error) {
      console.error(error);
      setError("Backend tidak dapat diakses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSupplies();
  }, []);

  // Mengirim data ke FastAPI
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!date || !gentanCode || !qty) {
      alert("Date, Kode Gentan, dan Qty wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/supplies",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: date,
            gentanCode: gentanCode,
            qty: Number(qty),
            remark: remark,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal menyimpan data");
      }

      // Ambil ulang data setelah berhasil menyimpan
      await fetchSupplies();

      // Kosongkan form
      setDate("");
      setGentanCode("");
      setQty("");
      setRemark("");

      alert("Supply berhasil disimpan!");
    } catch (error) {
      console.error(error);
      setError("Gagal menyimpan supply.");
    } finally {
      setSaving(false);
    }
  }

  const totalSupply = supplies.length;

  const totalQty = supplies.reduce(
    (total, supply) => total + supply.qty,
    0
  );

  const totalMaterial = new Set(
    supplies.map((supply) => supply.gentanCode)
  ).size;

  const supplyToday = supplies.filter(
    (supply) => supply.date === "2026-10-06"
  ).length;

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-950">
          Dashboard PPIC
        </h1>

        <p className="mt-2 text-base text-gray-600">
          Supply Material Line 7
        </p>
      </div>

      {loading && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          Mengambil data...
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-6 md:grid-cols-4">

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">
            Total Supply
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-950">
            {totalSupply}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">
            Total Qty
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-950">
            {totalQty}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">
            Total Material
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-950">
            {totalMaterial}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">
            Supply Hari Ini
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-950">
            {supplyToday}
          </h2>
        </div>

      </div>

      {/* FORM */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold text-gray-950">
          Input Supply Material
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-5 md:grid-cols-2"
        >

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Kode Gentan
            </label>

            <input
              type="text"
              value={gentanCode}
              onChange={(e) => setGentanCode(e.target.value)}
              placeholder="Contoh: G004"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Qty
            </label>

            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Contoh: 100"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">
              Remark
            </label>

            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Contoh: OK"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900"
            />
          </div>

          <div className="md:col-span-2">

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Supply"}
            </button>

          </div>

        </form>
      </div>

      {/* TABLE */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold text-gray-950">
          Data Supply Material
        </h2>

        <div className="mt-5 overflow-x-auto">

          <table className="w-full text-left">

            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">

                <th className="px-4 py-3 text-sm font-bold text-gray-800">
                  Tanggal
                </th>

                <th className="px-4 py-3 text-sm font-bold text-gray-800">
                  Kode Gentan
                </th>

                <th className="px-4 py-3 text-sm font-bold text-gray-800">
                  Qty
                </th>

                <th className="px-4 py-3 text-sm font-bold text-gray-800">
                  Remark
                </th>

              </tr>
            </thead>

            <tbody>

              {supplies.map((supply, index) => (

                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >

                  <td className="px-4 py-3 text-sm text-gray-800">
                    {supply.date}
                  </td>

                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {supply.gentanCode}
                  </td>

                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {supply.qty}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-700">
                    {supply.remark || "-"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      </div>

    </main>
  );
}