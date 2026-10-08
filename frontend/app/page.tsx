"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Supply = {
  id?: number;
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

  const [searchCode, setSearchCode] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchSupplies() {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("supplies")
        .select("id, date, gentan_code, qty, remark")
        .order("id", { ascending: false });

      if (error) throw error;

      const formattedData: Supply[] = (data ?? []).map((item) => ({
        id: item.id,
        date: item.date,
        gentanCode: item.gentan_code,
        qty: item.qty,
        remark: item.remark ?? "",
      }));

      setSupplies(formattedData);
    } catch (error) {
      console.error(error);
      setError("Gagal mengambil data dari Supabase.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSupplies();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!date || !gentanCode || !qty) {
      alert("Date, Kode Gentan, dan Qty wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { error } = await supabase.from("supplies").insert({
        date: date,
        gentan_code: gentanCode,
        qty: Number(qty),
        remark: remark,
      });

      if (error) throw error;

      await fetchSupplies();

      setDate("");
      setGentanCode("");
      setQty("");
      setRemark("");

      alert("Supply berhasil disimpan!");
    } catch (error) {
      console.error(error);
      setError("Gagal menyimpan supply ke Supabase.");
    } finally {
      setSaving(false);
    }
  }

  const filteredSupplies = useMemo(() => {
    return supplies.filter((supply) => {
      const matchesCode = supply.gentanCode
        .toLowerCase()
        .includes(searchCode.toLowerCase());

      const matchesDateFrom =
        !filterDateFrom || supply.date >= filterDateFrom;

      const matchesDateTo =
        !filterDateTo || supply.date <= filterDateTo;

      return matchesCode && matchesDateFrom && matchesDateTo;
    });
  }, [supplies, searchCode, filterDateFrom, filterDateTo]);

  const totalSupply = filteredSupplies.length;

  const totalQty = filteredSupplies.reduce(
    (total, supply) => total + supply.qty,
    0
  );

  const totalMaterial = new Set(
    filteredSupplies.map((supply) => supply.gentanCode)
  ).size;

  const today = new Date().toLocaleDateString("en-CA");

  const supplyToday = filteredSupplies.filter(
    (supply) => supply.date === today
  ).length;

  function resetFilter() {
    setSearchCode("");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard PPIC</h1>
          <p className="mt-1 text-gray-600">
            Supply Material Line 7
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total Supply</p>
            <p className="mt-2 text-3xl font-bold">{totalSupply}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total Qty</p>
            <p className="mt-2 text-3xl font-bold">{totalQty}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Total Material</p>
            <p className="mt-2 text-3xl font-bold">{totalMaterial}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">Supply Hari Ini</p>
            <p className="mt-2 text-3xl font-bold">{supplyToday}</p>
          </div>
        </div>

        {/* FORM INPUT */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Input Supply Material
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Kode Gentan
              </label>
              <input
                type="text"
                value={gentanCode}
                onChange={(e) => setGentanCode(e.target.value)}
                placeholder="Contoh: G001"
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Qty
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Qty"
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Remark
              </label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Keterangan"
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? "Menyimpan..." : "Simpan Supply"}
              </button>
            </div>
          </form>
        </div>

        {/* FILTER */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <h2 className="text-xl font-semibold">
              Filter Data
            </h2>

            <button
              onClick={resetFilter}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
            >
              Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Cari Kode Gentan
              </label>
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Contoh: G001"
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full rounded-lg border p-2"
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Data Supply
            </h2>

            <span className="text-sm text-gray-500">
              {filteredSupplies.length} data
            </span>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Memuat data...
            </p>
          ) : filteredSupplies.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Tidak ada data yang sesuai dengan filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="p-3">No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Kode Gentan</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Remark</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSupplies.map((supply, index) => (
                    <tr
                      key={supply.id ?? index}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{supply.date}</td>
                      <td className="p-3 font-medium">
                        {supply.gentanCode}
                      </td>
                      <td className="p-3">{supply.qty}</td>
                      <td className="p-3">{supply.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}