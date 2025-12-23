// ===========================================
// Serviço de IA para Resumos
// ===========================================

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';

export interface SummaryResult {
  summary: string;
  urgency: 'baixa' | 'média' | 'alta';
  actionRequired: string | null;
  tokensUsed: number;
}

export class AIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }

  /**
   * Gera um resumo da mensagem para profissionais
   */
  async generateSummary(
    content: string,
    options: {
      senderName?: string;
      subject?: string;
      profession?: string;
      isAudio?: boolean;
    } = {}
  ): Promise<SummaryResult> {
    const { senderName, subject, profession = 'profissional', isAudio = false } = options;

    const contextInfo = [
      senderName ? `Remetente: ${senderName}` : null,
      subject ? `Assunto: ${subject}` : null,
      isAudio ? '(Esta mensagem foi transcrita de um áudio)' : null,
    ]
      .filter(Boolean)
      .join('\n');

    const systemPrompt = `Você é um assistente de um ${profession} brasileiro. Sua tarefa é resumir mensagens de forma clara e objetiva para que o profissional possa fazer uma triagem rápida entre atendimentos.

Regras:
1. Seja conciso: máximo 2-3 frases
2. Destaque o ponto principal da mensagem
3. Identifique se há algo urgente ou que requer ação imediata
4. Use linguagem profissional mas acessível
5. Se for uma mensagem simples (ex: confirmação, agradecimento), indique isso brevemente
6. Responda sempre em português brasileiro

Formato de resposta (JSON):
{
  "resumo": "O resumo da mensagem em 2-3 frases",
  "urgencia": "baixa" | "média" | "alta",
  "acao_necessaria": "Descrição da ação se houver, ou null se não houver"
}`;

    const userMessage = contextInfo
      ? `${contextInfo}\n\nMensagem:\n${content}`
      : `Mensagem:\n${content}`;

    try {
      const response = await this.client.messages.create({
        model: config.summary.model,
        max_tokens: config.summary.maxTokens,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
        system: systemPrompt,
      });

      // Extrai o texto da resposta
      const responseText =
        response.content[0].type === 'text' ? response.content[0].text : '';

      // Tenta fazer parse do JSON
      const parsed = this.parseJsonResponse(responseText);

      return {
        summary: parsed.resumo || responseText,
        urgency: this.normalizeUrgency(parsed.urgencia),
        actionRequired: parsed.acao_necessaria || null,
        tokensUsed:
          (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      };
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);

      // Retorna um resumo básico em caso de erro
      return {
        summary: this.createFallbackSummary(content),
        urgency: 'média',
        actionRequired: null,
        tokensUsed: 0,
      };
    }
  }

  /**
   * Tenta fazer parse do JSON na resposta
   */
  private parseJsonResponse(text: string): {
    resumo?: string;
    urgencia?: string;
    acao_necessaria?: string | null;
  } {
    try {
      // Tenta encontrar JSON na resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Se não conseguir fazer parse, retorna objeto vazio
    }
    return {};
  }

  /**
   * Normaliza o valor de urgência
   */
  private normalizeUrgency(urgency?: string): 'baixa' | 'média' | 'alta' {
    const normalized = urgency?.toLowerCase().trim();
    if (normalized === 'alta' || normalized === 'high') return 'alta';
    if (normalized === 'baixa' || normalized === 'low') return 'baixa';
    return 'média';
  }

  /**
   * Cria um resumo básico quando a IA falha
   */
  private createFallbackSummary(content: string): string {
    const words = content.split(/\s+/);
    if (words.length <= 20) {
      return content;
    }
    return words.slice(0, 20).join(' ') + '...';
  }

  /**
   * Gera uma sugestão de resposta (opcional, para versão PRO)
   */
  async generateReplySuggestion(
    originalMessage: string,
    summary: string,
    options: {
      senderName?: string;
      profession?: string;
      tone?: 'formal' | 'informal';
    } = {}
  ): Promise<string> {
    const { senderName, profession = 'profissional', tone = 'formal' } = options;

    const systemPrompt = `Você é um assistente de um ${profession} brasileiro. 
Gere uma resposta ${tone === 'formal' ? 'profissional e formal' : 'cordial e amigável'} para a mensagem abaixo.
A resposta deve ser curta (2-4 frases) e direta.
Não invente informações específicas como horários ou valores.
Responda sempre em português brasileiro.`;

    const userMessage = `Mensagem original${senderName ? ` de ${senderName}` : ''}:
${originalMessage}

Resumo: ${summary}

Gere uma resposta apropriada:`;

    const response = await this.client.messages.create({
      model: config.summary.model,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      system: systemPrompt,
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /**
   * Classifica o tipo/categoria da mensagem
   */
  async classifyMessage(content: string): Promise<{
    category: string;
    confidence: number;
  }> {
    const systemPrompt = `Classifique a mensagem em uma das categorias:
- agendamento: pedidos para marcar, remarcar ou cancelar consultas/reuniões
- dúvida: perguntas sobre procedimentos, tratamentos, serviços
- urgente: problemas de saúde urgentes, emergências
- resultado: envio ou pedido de resultados de exames
- financeiro: questões sobre pagamentos, valores, convênios
- confirmação: confirmações de presença, recebimento
- outro: mensagens que não se encaixam nas categorias acima

Responda apenas com JSON: {"categoria": "...", "confianca": 0.0-1.0}`;

    const response = await this.client.messages.create({
      model: config.summary.model,
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Mensagem: ${content}`,
        },
      ],
      system: systemPrompt,
    });

    try {
      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      return {
        category: parsed.categoria || 'outro',
        confidence: parsed.confianca || 0.5,
      };
    } catch {
      return { category: 'outro', confidence: 0.5 };
    }
  }
}

// Singleton
export const aiService = new AIService();
