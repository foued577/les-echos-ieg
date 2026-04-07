import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { dashboardMessagesAPI } from '@/services/api';
import { 
  MessageSquare, 
  Plus, 
  Check, 
  Trash2, 
  Settings, 
  Loader2 
} from 'lucide-react';

const DashboardMessagesAdmin = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    label: '',
    content: '',
    icon: '👋'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [activatingId, setActivatingId] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await dashboardMessagesAPI.getAll();
      setMessages(response.data || []);
      console.log('📋 Dashboard messages loaded:', response.data);
    } catch (error) {
      console.error('📋 Error loading dashboard messages:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.label.trim() || !formData.content.trim()) {
      toast.error('Le label et le contenu sont requis');
      return;
    }

    try {
      setIsCreating(true);
      await dashboardMessagesAPI.create(formData);
      toast.success('Message créé avec succès');
      
      // Reset form
      setFormData({ label: '', content: '', icon: '👋' });
      
      // Reload messages
      loadMessages();
    } catch (error) {
      console.error('📋 Error creating message:', error);
      toast.error('Erreur lors de la création du message');
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivate = async (messageId) => {
    try {
      setActivatingId(messageId);
      await dashboardMessagesAPI.activate(messageId);
      toast.success('Message activé avec succès');
      
      // Reload messages to show updated active status
      loadMessages();
    } catch (error) {
      console.error('📋 Error activating message:', error);
      toast.error('Erreur lors de l\'activation du message');
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (messageId) => {
    const message = messages.find(m => m._id === messageId);
    
    if (!message) return;

    const confirmMessage = message.isActive 
      ? `⚠️ Attention : ce message est actuellement actif et visible dans le dashboard.\n\nSupprimer "${message.label}" ?`
      : `Supprimer le message "${message.label}" ?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await dashboardMessagesAPI.delete(messageId);
      toast.success('Message supprimé avec succès');
      
      // Reload messages
      loadMessages();
    } catch (error) {
      console.error('📋 Error deleting message:', error);
      toast.error('Erreur lors de la suppression du message');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-serif text-gray-900">Messages du Dashboard</h2>
      </div>

      {/* Create New Message Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouveau message</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                placeholder="ex: Message de bienvenue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={100}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icône
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                placeholder="👋"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={10}
              />
            </div>
            
            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Créer
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenu du message
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Bienvenue sur votre centre de connaissances"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              rows={3}
              maxLength={500}
            />
          </div>
        </form>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Messages existants ({messages.length})
          </h3>
        </div>
        
        {messages.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              Aucun message créé
            </p>
            <p className="text-gray-400 text-sm">
              Créez votre premier message de dashboard ci-dessus
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div key={message._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{message.icon}</span>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {message.label}
                      </h4>
                      {message.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <Check className="w-3 h-3" />
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {message.content}
                    </p>
                    <div className="mt-3 text-sm text-gray-500">
                      Créé par {message.createdBy?.name || 'Admin'} • 
                      {' ' + new Date(message.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {!message.isActive && (
                      <button
                        onClick={() => handleActivate(message._id)}
                        disabled={activatingId === message._id}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {activatingId === message._id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Activation...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Activer
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(message._id)}
                      className={`px-3 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                        message.isActive 
                          ? 'bg-orange-600 hover:bg-orange-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      {message.isActive ? 'Supprimer (actif)' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              Comment ça fonctionne ?
            </h4>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• Plusieurs messages peuvent être actifs simultanément</li>
              <li>• Les messages actifs s'affichent en carousel dans le dashboard</li>
              <li>• Utilisez les emojis pour personnaliser l'apparence</li>
              <li>• Tous les messages (actifs ou inactifs) peuvent être supprimés</li>
              <li>• La suppression d'un message actif le retire immédiatement du carousel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMessagesAdmin;
