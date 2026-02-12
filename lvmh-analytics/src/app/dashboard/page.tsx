"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Dataset = {
  id: string;
  name: string;
  source: string;
  row_count: number;
  status: string;
  uploaded_at: string;
};

type Note = {
  id: string;
  dataset_id: string;
  external_id: string;
  note_text: string;
  language: string;
  created_at: string;
};

type Tag = {
  id: string;
  note_id: string;
  tag: string;
  tag_family: string;
  confidence: number;
};

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

export default function DashboardPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      loadNotes(selectedDataset);
      loadTags(selectedDataset);
    }
  }, [selectedDataset]);

  const loadDatasets = async () => {
    try {
      const { data, error } = await supabase.from("datasets").select("*").order("uploaded_at", { ascending: false });
      if (error) throw error;
      setDatasets(data || []);
      if (data && data.length > 0 && !selectedDataset) {
        setSelectedDataset(data[0].id);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading datasets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (datasetId: string) => {
    try {
      const { data, error } = await supabase
        .from("client_notes")
        .select("*")
        .eq("dataset_id", datasetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading notes:", error);
    }
  };

  const loadTags = async (datasetId: string) => {
    try {
      const { data: notesData } = await supabase
        .from("client_notes")
        .select("id")
        .eq("dataset_id", datasetId);

      if (!notesData || notesData.length === 0) return;

      const noteIds = notesData.map((n) => n.id);
      const { data, error } = await supabase.from("note_tags").select("*").in("note_id", noteIds);
      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading tags:", error);
    }
  };

  const languageStats = notes.reduce((acc, note) => {
    const lang = note.language || "Unknown";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const languageData = Object.entries(languageStats).map(([name, value]) => ({ name, value }));

  const tagFamilyStats = tags.reduce((acc, tag) => {
    const family = tag.tag_family || "Sans catégorie";
    acc[family] = (acc[family] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tagFamilyData = Object.entries(tagFamilyStats).map(([name, value]) => ({ name, value }));

  const topTags = tags
    .reduce((acc, tag) => {
      const existing = acc.find((t) => t.tag === tag.tag);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ tag: tag.tag, count: 1, family: tag.tag_family });
      }
      return acc;
    }, [] as Array<{ tag: string; count: number; family: string }>)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
          Dashboard LVMH Analytics
        </h1>

        {/* Sélection du dataset */}
        <div className="mb-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <label className="block text-sm font-medium mb-2 text-gray-300">Sélectionner un dataset</label>
          <select
            value={selectedDataset || ""}
            onChange={(e) => setSelectedDataset(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.row_count} lignes) - {new Date(ds.uploaded_at).toLocaleDateString("fr-FR")}
              </option>
            ))}
          </select>
        </div>

        {selectedDataset && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-6 border border-emerald-500/30">
                <div className="text-sm text-gray-300 mb-1">Total Notes</div>
                <div className="text-3xl font-bold text-emerald-400">{notes.length}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30">
                <div className="text-sm text-gray-300 mb-1">Total Tags</div>
                <div className="text-3xl font-bold text-blue-400">{tags.length}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30">
                <div className="text-sm text-gray-300 mb-1">Langues</div>
                <div className="text-3xl font-bold text-purple-400">{Object.keys(languageStats).length}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl p-6 border border-orange-500/30">
                <div className="text-sm text-gray-300 mb-1">Catégories</div>
                <div className="text-3xl font-bold text-orange-400">{Object.keys(tagFamilyStats).length}</div>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Répartition par langue */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Répartition par Langue</h2>
                {languageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={languageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {languageData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-400 text-center py-12">Aucune donnée disponible</div>
                )}
              </div>

              {/* Répartition par catégorie de tags */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Répartition par Catégorie</h2>
                {tagFamilyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tagFamilyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-400 text-center py-12">Aucune donnée disponible</div>
                )}
              </div>
            </div>

            {/* Top tags */}
            {topTags.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Top 10 Tags</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {topTags.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-emerald-500 transition-colors"
                    >
                      <div className="text-sm text-gray-400 mb-1">{item.family || "Sans catégorie"}</div>
                      <div className="text-lg font-semibold text-emerald-400">{item.tag}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.count} occurrence{item.count > 1 ? "s" : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des notes */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">Notes ({notes.length})</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notes.map((note) => {
                  const noteTags = tags.filter((t) => t.note_id === note.id);
                  return (
                    <div key={note.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-emerald-400">ID: {note.external_id}</div>
                        <div className="text-xs text-gray-400">
                          {note.language && (
                            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded mr-2">{note.language}</span>
                          )}
                          {new Date(note.created_at).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2">{note.note_text}</p>
                      {noteTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {noteTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30"
                            >
                              {tag.tag} ({tag.tag_family})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
