import React, { useState } from 'react';
import { DOC_ARTICLES, type DocArticle } from './docsData';
import { EngineCatalogView } from './EngineCatalogView';
import { MaterialCatalogView } from './MaterialCatalogView';

interface DocumentationViewProps {
  onBack: () => void;
}

type TabMode = 'articles' | 'engines' | 'materials';

export const DocumentationView: React.FC<DocumentationViewProps> = ({ onBack }) => {
  const [tab, setTab] = useState<TabMode>('articles');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(DOC_ARTICLES[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedArticle: DocArticle =
    DOC_ARTICLES.find((a) => a.id === selectedArticleId) || DOC_ARTICLES[0];

  const filteredArticles = DOC_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-panel)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn-ghost" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Main Menu
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📚</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-cyan)' }}>
              SpaceRocket Aerospace Reference & Engineering Library
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={tab === 'articles' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTab('articles')}
            style={{ fontSize: 12, padding: '6px 14px' }}
          >
            Engineering Guide
          </button>
          <button
            className={tab === 'engines' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTab('engines')}
            style={{ fontSize: 12, padding: '6px 14px' }}
          >
            Engine Database
          </button>
          <button
            className={tab === 'materials' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTab('materials')}
            style={{ fontSize: 12, padding: '6px 14px' }}
          >
            Materials Catalog
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 16 }}>
        {tab === 'engines' && <div style={{ height: '100%', overflowY: 'auto' }}><EngineCatalogView /></div>}
        {tab === 'materials' && <div style={{ height: '100%', overflowY: 'auto' }}><MaterialCatalogView /></div>}

        {tab === 'articles' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: '100%' }}>
            {/* Left Article Sidebar */}
            <div className="panel" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
              <input
                type="text"
                placeholder="Search guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  fontSize: 12
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredArticles.map((art) => {
                  const isSelected = selectedArticle.id === art.id;
                  return (
                    <button
                      key={art.id}
                      onClick={() => setSelectedArticleId(art.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(0, 212, 255, 0.08)' : 'var(--bg-elevated)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <span style={{ fontSize: 10, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {art.category}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', marginTop: 2 }}>
                        {art.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Article Reader Pane */}
            <div className="panel" style={{ padding: 24, overflowY: 'auto', background: 'var(--bg-panel)' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 11, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {selectedArticle.category}
                </span>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{selectedArticle.title}</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{selectedArticle.subtitle}</p>
              </div>

              {/* Render article text with pre-formatted spacing */}
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {selectedArticle.content.trim()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
