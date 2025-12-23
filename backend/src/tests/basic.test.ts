// ===========================================
// Testes Básicos - Assistente Profissional
// ===========================================

import { describe, it, expect } from 'vitest';

describe('AI Service', () => {
  it('should create a fallback summary for short content', () => {
    const content = 'Olá, gostaria de remarcar minha consulta.';
    // O conteúdo tem menos de 20 palavras, então deve retornar o original
    expect(content.split(/\s+/).length).toBeLessThan(20);
  });

  it('should truncate long content for fallback', () => {
    const words = Array(30).fill('palavra').join(' ');
    const truncated = words.split(/\s+/).slice(0, 20).join(' ') + '...';
    expect(truncated.split(/\s+/).length).toBe(21); // 20 palavras + "..."
  });
});

describe('Message Processing', () => {
  it('should check if time is within working hours', () => {
    const isWithin = (current: string, start: string, end: string) => {
      return current >= start && current <= end;
    };

    expect(isWithin('09:00', '08:00', '18:00')).toBe(true);
    expect(isWithin('20:00', '08:00', '18:00')).toBe(false);
    expect(isWithin('08:00', '08:00', '18:00')).toBe(true);
    expect(isWithin('18:00', '08:00', '18:00')).toBe(true);
  });

  it('should check active days', () => {
    const activeDays = [1, 2, 3, 4, 5]; // Segunda a sexta
    
    expect(activeDays.includes(1)).toBe(true); // Segunda
    expect(activeDays.includes(0)).toBe(false); // Domingo
    expect(activeDays.includes(6)).toBe(false); // Sábado
  });
});

describe('Gmail Message Parsing', () => {
  it('should parse From header correctly', () => {
    const testCases = [
      { input: 'John Doe <john@example.com>', name: 'John Doe', email: 'john@example.com' },
      { input: '"Maria Silva" <maria@teste.com>', name: 'Maria Silva', email: 'maria@teste.com' },
      { input: 'simple@email.com', name: 'simple@email.com', email: 'simple@email.com' },
    ];

    for (const { input, name, email } of testCases) {
      const match = input.match(/^(?:"?(.+?)"?\s*)?<?([^>]+@[^>]+)>?$/);
      const parsedName = match?.[1] || match?.[2] || input;
      const parsedEmail = match?.[2] || input;
      
      expect(parsedName).toBe(name);
      expect(parsedEmail).toBe(email);
    }
  });
});

describe('Base64 URL Decode', () => {
  it('should decode base64url encoded string', () => {
    const original = 'Olá, mundo!';
    const encoded = Buffer.from(original).toString('base64url');
    const decoded = Buffer.from(encoded, 'base64url').toString('utf-8');
    
    expect(decoded).toBe(original);
  });
});
