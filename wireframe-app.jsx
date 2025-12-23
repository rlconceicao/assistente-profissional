import React, { useState } from 'react';
import { Bell, Mail, MessageCircle, Settings, ChevronRight, ChevronLeft, Mic, Clock, Check, CheckCheck, Send, User, Shield, CreditCard, HelpCircle, Moon, Volume2 } from 'lucide-react';

export default function WireframeApp() {
  const [currentScreen, setCurrentScreen] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  const messages = [
    {
      id: 1,
      sender: 'Maria Silva',
      source: 'whatsapp',
      time: '10:32',
      isAudio: true,
      audioDuration: '2:45',
      original: 'Áudio de 2:45 minutos',
      summary: 'Paciente relata dores de cabeça frequentes há 3 dias, já tomou paracetamol sem melhora. Pergunta se pode tomar algo mais forte.',
      status: 'unread',
      autoReplySent: true
    },
    {
      id: 2,
      sender: 'João Santos',
      source: 'email',
      time: '09:15',
      isAudio: false,
      original: 'E-mail longo sobre resultados de exames...',
      summary: 'Enviou resultados de exames de sangue. Hemograma normal, mas glicose levemente alterada (110 mg/dL). Quer saber se precisa de consulta presencial.',
      status: 'read',
      autoReplySent: true
    },
    {
      id: 3,
      sender: 'Ana Costa',
      source: 'whatsapp',
      time: '08:47',
      isAudio: false,
      original: 'Texto longo sobre reagendamento...',
      summary: 'Precisa remarcar consulta de quinta para sexta-feira, qualquer horário após 14h.',
      status: 'read',
      autoReplySent: true
    },
    {
      id: 4,
      sender: 'Pedro Lima',
      source: 'whatsapp',
      time: 'Ontem',
      isAudio: true,
      audioDuration: '1:20',
      original: 'Áudio de 1:20 minutos',
      summary: 'Confirma presença na consulta de amanhã às 15h. Pergunta se precisa levar exames anteriores.',
      status: 'replied',
      autoReplySent: true
    }
  ];

  const BottomNav = () => (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around">
      <button 
        onClick={() => setCurrentScreen('inbox')}
        className={`flex flex-col items-center ${currentScreen === 'inbox' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <Mail size={22} />
        <span className="text-xs mt-1">Mensagens</span>
      </button>
      <button 
        onClick={() => setCurrentScreen('settings')}
        className={`flex flex-col items-center ${currentScreen === 'settings' ? 'text-blue-600' : 'text-gray-400'}`}
      >
        <Settings size={22} />
        <span className="text-xs mt-1">Ajustes</span>
      </button>
    </div>
  );

  const StatusBadge = ({ status }) => {
    if (status === 'unread') return <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>;
    if (status === 'read') return <Check size={16} className="text-gray-400" />;
    if (status === 'replied') return <CheckCheck size={16} className="text-green-500" />;
    return null;
  };

  const InboxScreen = () => (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Resumos</h1>
            <p className="text-sm text-gray-500">4 mensagens hoje</p>
          </div>
          <div className="relative">
            <Bell size={24} className="text-gray-600" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">1</span>
            </div>
          </div>
        </div>
        
        {/* Auto-reply status */}
        <div className="mt-3 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-700">Resposta automática ativa</span>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-auto pb-20">
        {messages.map((msg) => (
          <button
            key={msg.id}
            onClick={() => {
              setSelectedMessage(msg);
              setCurrentScreen('detail');
            }}
            className={`w-full px-4 py-4 border-b border-gray-100 flex gap-3 text-left hover:bg-gray-50 transition-colors ${msg.status === 'unread' ? 'bg-blue-50' : 'bg-white'}`}
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">{msg.sender.split(' ').map(n => n[0]).join('')}</span>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${msg.status === 'unread' ? 'text-gray-900' : 'text-gray-700'}`}>
                    {msg.sender}
                  </span>
                  {msg.source === 'whatsapp' ? (
                    <MessageCircle size={14} className="text-green-500" />
                  ) : (
                    <Mail size={14} className="text-blue-500" />
                  )}
                  {msg.isAudio && (
                    <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      <Mic size={10} />
                      {msg.audioDuration}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{msg.time}</span>
                  <StatusBadge status={msg.status} />
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.summary}</p>
              
              {msg.autoReplySent && msg.status === 'unread' && (
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                  <Check size={12} />
                  <span>Resposta automática enviada</span>
                </div>
              )}
            </div>
            
            <ChevronRight size={20} className="text-gray-300 flex-shrink-0 self-center" />
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );

  const DetailScreen = () => (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentScreen('inbox')}
            className="p-1 -ml-1 text-gray-600"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {selectedMessage?.sender.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{selectedMessage?.sender}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {selectedMessage?.source === 'whatsapp' ? (
                <>
                  <MessageCircle size={12} className="text-green-500" />
                  <span>WhatsApp</span>
                </>
              ) : (
                <>
                  <Mail size={12} className="text-blue-500" />
                  <span>E-mail</span>
                </>
              )}
              <span>•</span>
              <span>{selectedMessage?.time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Summary Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-lg">✨</span>
            </div>
            <h3 className="font-semibold text-gray-900">Resumo</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{selectedMessage?.summary}</p>
        </div>

        {/* Original Message Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              {selectedMessage?.isAudio ? <Mic size={16} className="text-gray-600" /> : <Mail size={16} className="text-gray-600" />}
            </div>
            <h3 className="font-semibold text-gray-900">
              {selectedMessage?.isAudio ? 'Transcrição do áudio' : 'Mensagem original'}
            </h3>
          </div>
          
          {selectedMessage?.isAudio ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <button className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Volume2 size={18} className="text-white" />
                </button>
                <div className="flex-1">
                  <div className="h-1 bg-gray-200 rounded-full">
                    <div className="h-1 bg-blue-600 rounded-full w-1/3"></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0:00</span>
                    <span>{selectedMessage?.audioDuration}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm italic">
                "Olá doutor, tudo bem? Então, estou ligando porque faz três dias que estou com umas dores de cabeça muito fortes, sabe? Já tomei paracetamol mas não está melhorando nada. Queria saber se posso tomar algo mais forte, tipo uma dipirona ou ibuprofeno..."
              </p>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">{selectedMessage?.original}</p>
          )}
        </div>

        {/* Auto-reply sent confirmation */}
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-2">
            <CheckCheck size={18} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">Resposta automática enviada às {selectedMessage?.time}</span>
          </div>
          <p className="text-sm text-green-700 mt-2 italic">
            "Recebi sua mensagem! No momento estou em atendimento, mas retorno assim que possível. Obrigado pela compreensão."
          </p>
        </div>
      </div>

      {/* Reply Bar */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Digite sua resposta..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
            <Send size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Ajustes</h1>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto pb-20">
        {/* Profile Section */}
        <div className="bg-white p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">DR</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Dr. Roberto Mendes</h2>
              <p className="text-sm text-gray-500">Cardiologista</p>
              <p className="text-xs text-gray-400">dr.roberto@email.com</p>
            </div>
          </div>
        </div>

        {/* Auto-reply Section */}
        <div className="bg-white mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resposta Automática</h3>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <MessageCircle size={20} className="text-green-600" />
                </div>
                <div>
                  <span className="font-medium text-gray-900">Ativar resposta automática</span>
                  <p className="text-xs text-gray-500">Envia confirmação ao receber mensagens</p>
                </div>
              </div>
              <button 
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className={`w-12 h-7 rounded-full transition-colors ${autoReplyEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${autoReplyEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Mensagem automática:</label>
              <textarea 
                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                defaultValue="Recebi sua mensagem! No momento estou em atendimento, mas retorno assim que possível. Obrigado pela compreensão."
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Horário de funcionamento:</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">08:00</span>
                </div>
                <span className="self-center text-gray-400">até</span>
                <div className="flex-1 bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">18:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connections Section */}
        <div className="bg-white mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Conexões</h3>
          </div>
          
          <button className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageCircle size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <span className="font-medium text-gray-900">WhatsApp Business</span>
                <p className="text-xs text-green-600">Conectado</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <span className="font-medium text-gray-900">Gmail</span>
                <p className="text-xs text-green-600">Conectado</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button className="w-full px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Mail size={20} className="text-purple-600" />
              </div>
              <div className="text-left">
                <span className="font-medium text-gray-900">Outlook</span>
                <p className="text-xs text-gray-400">Não conectado</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Other Settings */}
        <div className="bg-white mb-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Outros</h3>
          </div>
          
          <button className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <User size={20} className="text-gray-400" />
              <span className="text-gray-900">Minha conta</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-gray-400" />
              <span className="text-gray-900">Assinatura</span>
            </div>
            <span className="text-sm text-green-600 font-medium">Pro</span>
          </button>

          <button className="w-full px-4 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-gray-400" />
              <span className="text-gray-900">Privacidade e LGPD</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>

          <button className="w-full px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle size={20} className="text-gray-400" />
              <span className="text-gray-900">Ajuda e suporte</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-4">
      <h2 className="text-xl font-bold text-gray-700 mb-4">📱 Wireframe - Assistente para Profissionais</h2>
      <p className="text-gray-500 mb-4 text-center max-w-md">Clique nas mensagens e nos itens de menu para navegar</p>
      
      {/* Phone Frame */}
      <div className="relative w-[375px] h-[750px] bg-black rounded-[3rem] p-3 shadow-2xl">
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10"></div>
          
          {/* Status Bar */}
          <div className="h-12 bg-white flex items-end justify-between px-8 pb-1 text-xs font-medium">
            <span>9:41</span>
            <div className="flex gap-1 items-center">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              </div>
              <span className="ml-1">5G</span>
              <div className="w-6 h-3 border border-gray-900 rounded-sm ml-1">
                <div className="w-4 h-full bg-gray-900 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-48px)]">
            {currentScreen === 'inbox' && <InboxScreen />}
            {currentScreen === 'detail' && <DetailScreen />}
            {currentScreen === 'settings' && <SettingsScreen />}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Não lida</span>
        </div>
        <div className="flex items-center gap-2">
          <Check size={14} className="text-gray-400" />
          <span>Lida</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCheck size={14} className="text-green-500" />
          <span>Respondida</span>
        </div>
        <div className="flex items-center gap-2">
          <Mic size={14} className="text-orange-500" />
          <span>Áudio</span>
        </div>
      </div>
    </div>
  );
}
