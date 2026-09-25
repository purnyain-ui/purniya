'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Plus, Edit2, Trash2, Video, CheckCircle2, XCircle } from 'lucide-react';


interface InstagramVideo {
  id: string;
  url: string;
  title: string | null;
  is_active: boolean;
  created_at: string;
}

export default function VideosFeedAdminPage() {
  const [videos, setVideos] = useState<InstagramVideo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<InstagramVideo | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    is_active: true,
  });

  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instagram_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          showToast('Table instagram_videos does not exist. Please run the SQL migration.', 'error');
        } else {
          showToast(`Error loading videos: ${error.message}`, 'error');
        }
        return;
      }

      setVideos(data || []);
    } catch (err: any) {
      showToast('Failed to fetch videos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) {
      showToast('Instagram URL is required', 'error');
      return;
    }

    try {
      if (editingVideo) {
        const { error } = await supabase
          .from('instagram_videos')
          .update({
            url: formData.url,
            title: formData.title || null,
            is_active: formData.is_active,
          })
          .eq('id', editingVideo.id);

        if (error) throw error;
        showToast('Video updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('instagram_videos')
          .insert([
            {
              url: formData.url,
              title: formData.title || null,
              is_active: formData.is_active,
            }
          ]);

        if (error) throw error;
        showToast('Video added successfully', 'success');
      }

      closeModal();
      fetchVideos();
    } catch (err: any) {
      showToast(`Error saving video: ${err.message}`, 'error');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('instagram_videos')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      showToast(currentStatus ? 'Video hidden' : 'Video set to active', 'success');
      fetchVideos();
    } catch (err: any) {
      showToast('Error updating status', 'error');
    }
  };

  const deleteVideo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('instagram_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Video deleted successfully', 'success');
      fetchVideos();
    } catch (err: any) {
      showToast('Error deleting video', 'error');
    }
  };

  const openModal = (video?: InstagramVideo) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        url: video.url,
        title: video.title || '',
        is_active: video.is_active,
      });
    } else {
      setEditingVideo(null);
      setFormData({
        url: '',
        title: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVideo(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[#E2DBD0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0B241C] flex items-center gap-3">
            <Video className="w-6 h-6 text-[#C5A059]" />
            Instagram Videos Feed
          </h1>
          <p className="text-sm text-[#5A7469] mt-1">
            Manage your curated Instagram video links to show on the front end.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#0B241C] text-white px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-[#144234] transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Video
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2DBD0] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#5A7469]">Loading videos...</div>
        ) : videos.length === 0 ? (
          <div className="p-8 text-center text-[#5A7469]">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No videos found</p>
            <p className="text-xs mt-1">Click "Add Video" to add your first Instagram link.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#5A7469] text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold border-b border-[#E2DBD0]">Title / Label</th>
                <th className="p-4 font-semibold border-b border-[#E2DBD0]">Instagram URL</th>
                <th className="p-4 font-semibold border-b border-[#E2DBD0]">Status</th>
                <th className="p-4 font-semibold border-b border-[#E2DBD0] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="border-b border-[#E2DBD0] hover:bg-[#FAF8F5]/50 transition">
                  <td className="p-4">
                    <span className="font-semibold text-[#0B241C]">
                      {video.title || 'Untitled Video'}
                    </span>
                  </td>
                  <td className="p-4">
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-600 hover:underline text-sm truncate max-w-xs block"
                    >
                      {video.url}
                    </a>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(video.id, video.is_active)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        video.is_active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      {video.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {video.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => openModal(video)}
                      className="p-2 text-[#5A7469] hover:text-[#C5A059] bg-[#FAF8F5] rounded-xl hover:bg-[#EBF3EF] transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="p-2 text-[#5A7469] hover:text-rose-600 bg-[#FAF8F5] rounded-xl hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#E2DBD0] flex items-center justify-between bg-[#FAF8F5]">
              <h2 className="text-xl font-bold text-[#0B241C]">
                {editingVideo ? 'Edit Video Link' : 'Add New Video'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-[#5A7469] hover:text-rose-600 rounded-full hover:bg-white transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#0B241C] mb-1">
                  Title / Label (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-[#E2DBD0] rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none"
                  placeholder="e.g. Summer Collection Reel"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B241C] mb-1">
                  Instagram Post/Reel URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full p-3 border border-[#E2DBD0] rounded-xl focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none"
                  placeholder="https://www.instagram.com/reel/..."
                />
              </div>

              <div className="flex items-center gap-3 bg-[#FAF8F5] p-4 rounded-xl border border-[#E2DBD0]">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-[#C5A059] rounded focus:ring-[#C5A059]"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-[#0B241C] cursor-pointer select-none">
                  Make this video active immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2DBD0]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-[#5A7469] hover:bg-[#FAF8F5] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#0B241C] text-white hover:bg-[#144234] shadow-sm transition"
                >
                  {editingVideo ? 'Update Video' : 'Save Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-[70] px-4 py-3 rounded-xl shadow-lg text-xs font-semibold border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          } flex items-center gap-2 animate-in fade-in slide-in-from-top-4`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600" />
          )}
          <p>{toastMessage.message}</p>
        </div>
      )}
    </div>
  );
}
