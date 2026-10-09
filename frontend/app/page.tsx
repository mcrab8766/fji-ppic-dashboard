"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

  const [editingId, setEditingId] = useState<number | null>(null);

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

      if (editingId !== null) {
        const { error } = await supabase
          .from("supplies")
          .update({
            date,
            gentan_code: gentanCode,
            qty: Number(qty),
            remark,
          })
          .eq("id", editingId);

        if (error) throw error;

        alert("Supply berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("supplies").insert({
          date,
          gentan_code: gentanCode,
          qty: Number(qty),
          remark,
        });

        if (error) throw error;

        alert("Supply berhasil disimpan!");
      }

      await fetchSupplies();
      resetForm();
    } catch (error) {
      console.error(error);
      setError(
        editingId !== null
          ? "Gagal memperbarui supply ke Supabase."
          : "Gagal menyimpan supply ke Supabase."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(supply: Supply) {
    setEditingId(supply.id ?? null);
    setDate(supply.date);
    setGentanCode(supply.gentanCode);
    setQty(String(supply.qty));
    setRemark(supply.remark);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setEditingId(null);
    setDate("");
    setGentanCode("");
    setQty("");
    setRemark("");
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Yakin ingin menghapus data supply ini?");
    if (!confirmed) return;

    try {
      setError("");
      const { error } = await supabase.from("supplies").delete().eq("id", id);
      if (error) throw error;
      alert("Supply berhasil dihapus!");
      await fetchSupplies();
    } catch (error) {
      console.error(error);
      setError("Gagal menghapus supply dari Supabase.");
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

  function handleExportExcel() {
    if (filteredSupplies.length === 0) {
      alert("Tidak ada data yang dapat diekspor.");
      return;
    }

    const exportData = filteredSupplies.map((supply, index) => ({
      No: index + 1,
      Date: supply.date,
      "Kode Gentan": supply.gentanCode,
      Qty: supply.qty,
      Remark: supply.remark,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Supply Material"
    );

    const formatTanggal = (tanggal: string) => {
  const [tahun, bulan, hari] = tanggal.split("-");
  return `${hari}-${bulan}-${tahun}`;
};

let namaFile = "Data-Supply-Material";

if (filterDateFrom && filterDateTo) {
  namaFile += `-${formatTanggal(filterDateFrom)}_s.d_${formatTanggal(filterDateTo)}`;
} else if (filterDateFrom) {
  namaFile += `-Mulai-${formatTanggal(filterDateFrom)}`;
} else if (filterDateTo) {
  namaFile += `-Sampai-${formatTanggal(filterDateTo)}`;
} else {
  namaFile += "-Semua-Tanggal";
}

XLSX.writeFile(workbook, `${namaFile}.xlsx`);
  }
  // =========================
  // SUMMARY
  // =========================

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

  // =========================
  // GRAFIK 1
  // QTY SUPPLY PER HARI
  // =========================

  const dailyChartData = useMemo(() => {
    const grouped: Record<string, number> = {};

    filteredSupplies.forEach((supply) => {
      if (!grouped[supply.date]) {
        grouped[supply.date] = 0;
      }

      grouped[supply.date] += supply.qty;
    });

    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, qty]) => ({
        date,
        qty,
      }));
  }, [filteredSupplies]);

  // =========================
  // GRAFIK 2 & 3
  // PER KODE GENTAN
  // =========================

  const gentanChartData = useMemo(() => {
    const grouped: Record<
      string,
      { qty: number; transaksi: number }
    > = {};

    filteredSupplies.forEach((supply) => {
      if (!grouped[supply.gentanCode]) {
        grouped[supply.gentanCode] = {
          qty: 0,
          transaksi: 0,
        };
      }

      grouped[supply.gentanCode].qty += supply.qty;
      grouped[supply.gentanCode].transaksi += 1;
    });

    return Object.entries(grouped)
      .sort(([, a], [, b]) => b.qty - a.qty)
      .map(([gentanCode, data]) => ({
        gentanCode,
        qty: data.qty,
        transaksi: data.transaksi,
      }));
  }, [filteredSupplies]);

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
          <h1 className="text-3xl font-bold">
            Dashboard PPIC
          </h1>

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
            <p className="text-sm text-gray-500">
              Total Supply
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalSupply}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Total Qty
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalQty}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Total Material
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalMaterial}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm text-gray-500">
              Supply Hari Ini
            </p>

            <p className="mt-2 text-3xl font-bold">
              {supplyToday}
            </p>
          </div>

        </div>

        {/* FORM INPUT / EDIT */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingId !== null
                ? "Edit Supply Material"
                : "Input Supply Material"}
            </h2>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
              >
                Batal Edit
              </button>
            )}
          </div>

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
                {saving
                  ? "Menyimpan..."
                  : editingId !== null
                    ? "Update Supply"
                    : "Simpan Supply"}
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
                onChange={(e) =>
                  setSearchCode(e.target.value)
                }
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
                onChange={(e) =>
                  setFilterDateFrom(e.target.value)
                }
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
                onChange={(e) =>
                  setFilterDateTo(e.target.value)
                }
                className="w-full rounded-lg border p-2"
              />
            </div>

          </div>

        </div>

        
        {/* TABLE */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow">

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Data Supply
            </h2>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {filteredSupplies.length} data
              </span>

              <button
                type="button"
                onClick={handleExportExcel}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Export Excel
              </button>
            </div>
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
                    <th className="p-3">Action</th>
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
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(supply)}
                            className="rounded-lg bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-600"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              supply.id !== undefined &&
                              handleDelete(supply.id)
                            }
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GRAFIK */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* GRAFIK HARIAN */}
          <div className="rounded-xl bg-white p-6 shadow">

            <h2 className="mb-4 text-xl font-semibold">
              Qty Supply per Hari
            </h2>

            <div className="h-80">

              {dailyChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Tidak ada data
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart data={dailyChartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="date" />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="qty"
                      name="Qty Supply"
                    />

                  </BarChart>
                </ResponsiveContainer>
              )}

            </div>

          </div>

          {/* GRAFIK GENTAN */}
          <div className="rounded-xl bg-white p-6 shadow">

            <h2 className="mb-4 text-xl font-semibold">
              Qty Supply per Kode Gentan
            </h2>

            <div className="h-80">

              {gentanChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Tidak ada data
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart data={gentanChartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="gentanCode" />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="qty"
                      name="Qty Supply"
                    />

                  </BarChart>
                </ResponsiveContainer>
              )}

            </div>

          </div>

          {/* TRANSAKSI */}
          <div className="rounded-xl bg-white p-6 shadow lg:col-span-2">

            <h2 className="mb-4 text-xl font-semibold">
              Jumlah Transaksi per Kode Gentan
            </h2>

            <div className="h-80">

              {gentanChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Tidak ada data
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart data={gentanChartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="gentanCode" />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="transaksi"
                      name="Jumlah Transaksi"
                    />

                  </BarChart>
                </ResponsiveContainer>
              )}

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}