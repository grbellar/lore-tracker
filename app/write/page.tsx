'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useMoment } from '../hooks/useMoment';
import Sidebar from '../components/Sidebar';
import Breadcrumb from '../components/Breadcrumb';
import ArticleHeader from '../components/ArticleHeader';
import Editor from '../components/Editor';
import NewEntityModal from '../components/NewEntityModal';
import EntityCard from '../components/EntityCard';
import Toast from '../components/Toast';

export default function WritePage() {
  const searchParams = useSearchParams();
  const momentIdFromUrl = searchParams.get('moment');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [title, setTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [currentMomentId, setCurrentMomentId] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isLoadingMoment, setIsLoadingMoment] = useState(false);

  const { loading, error, success, saveMoment, updateMoment, clearStatus } = useMoment();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContent = useRef({ title: '', content: '' });
  const hasLoadedMoment = useRef(false);

  // Function to load a moment by ID
  const loadMoment = useCallback(async (momentId: string) => {
    setIsLoadingMoment(true);
    try {
      const response = await fetch(`/api/moments/${momentId}?fields=full`);

      if (!response.ok) {
        throw new Error('Failed to load moment');
      }

      const result = await response.json();
      const moment = result.data;

      // Populate the editor with moment data
      setTitle(moment.title || '');
      setEditorContent(moment.content || '');
      setCurrentMomentId(moment.id);
      setLastUpdatedTime(new Date(moment.updated_at));

      // Update last saved content to prevent immediate auto-save
      lastSavedContent.current = {
        title: moment.title || '',
        content: moment.content || ''
      };
    } catch (err) {
      setToastMessage('Failed to load moment');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoadingMoment(false);
    }
  }, [error]);

  // Load moment from URL parameter if provided
  useEffect(() => {
    if (momentIdFromUrl && !hasLoadedMoment.current) {
      hasLoadedMoment.current = true;
      loadMoment(momentIdFromUrl);
    }
  }, [momentIdFromUrl, loadMoment]);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    // Collapse sidebar when expanding to full screen
    if (!isExpanded) {
      setSidebarExpanded(false);
    }
  };

  // Format last updated time
  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const updateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (today.getTime() === updateDate.getTime()) {
      // If today, show time only
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      // If not today, show date
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Auto-save function
  const performSave = useCallback(async () => {
    // Don't save if both title and content are empty
    if (!title.trim() && !editorContent.trim()) {
      return;
    }

    // Check if content actually changed
    if (title === lastSavedContent.current.title && editorContent === lastSavedContent.current.content) {
      return;
    }

    try {
      setSaveStatus('saving');

      if (currentMomentId) {
        // Update existing moment
        await updateMoment(currentMomentId, {
          title,
          content: editorContent,
        });
      } else {
        // Create new moment
        const newMoment = await saveMoment({
          title,
          content: editorContent,
        });
        setCurrentMomentId(newMoment.id);
      }

      // Update last saved content and timestamp
      lastSavedContent.current = { title, content: editorContent };
      setLastUpdatedTime(new Date());

      setSaveStatus('saved');

      // Reset to idle after showing "Saved" for 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      setSaveStatus('idle');
      setToastMessage(error || 'Failed to save moment');
      setToastType('error');
      setShowToast(true);
    }
  }, [title, editorContent, currentMomentId, saveMoment, updateMoment, error]);

  // Debounced auto-save effect
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Don't set timeout if both title and content are empty
    if (!title.trim() && !editorContent.trim()) {
      return;
    }

    // Set new timeout for auto-save (3 seconds after last edit)
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, editorContent, performSave]);

  // Hard-coded data
  const breadcrumbItems = [
    { label: 'Book 1' },
    { label: 'Chapter 1' }
  ];

  const lastUpdated = formatLastUpdated(lastUpdatedTime);
  const readTime = Math.ceil(wordCount / 200) + ' Minute Read';

  const entityCardData = {
    type: 'CHARACTER',
    name: 'Mark Janzen',
    lastUpdated: 'August 20, 2025',
    momentCount: 15,
    description: "Mark Janzen is the real-life CEO of Planetary Talent Inc., based in Wichita, Kansas. In the lore, Mark's discovery of Maxwell's computer at the Living Computer Museum in Seattle and purchased it from the museum when they were considering closing.\n\nDuring the Covid pandemic, when he moved back to Wichita, Mark found the old computer and decided to try to get it working. Little did he know, this would lead to the founding of Planetary Talent. The computer contained files and plans that inspired Mark to realize Maxwell's vision.",
    books: [
      {
        title: 'Book 1: The Beginning',
        isExpanded: true,
        chapters: [
          {
            title: 'Chapter 1: The First Thing',
            momentCount: 14,
            isExpanded: true,
            moments: [
              { text: '...Mark gave the machine a solid thump on its side...' },
              { text: 'As he looked around, Mark wonder' },
              { text: 'As he t' },
              { text: '...Mark arranged the meeting...' },
              { text: '"What is this?" Mark asked.' },
              { text: 'The door next to him' },
              { text: '"What is' },
              { text: 'As Mark took the first step...' },
              { text: '...and Mark turned toward him...' },
              { text: '"What\'s the meaning' },
              { text: '...and M' }
            ]
          },
          {
            title: 'Chapter 2: The Man in the Goggles',
            momentCount: 14,
            isExpanded: false
          },
          {
            title: 'Chapter 3: The Man in the Goggles',
            momentCount: 17,
            isExpanded: false
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background text-white-text flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddEntity={() => setEntityModalOpen(true)}
        isExpanded={sidebarExpanded}
        onToggleExpand={() => setSidebarExpanded(!sidebarExpanded)}
      />

      {/* New Entity Modal */}
      <NewEntityModal
        isOpen={entityModalOpen}
        onClose={() => setEntityModalOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-card-on-card p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-light-text hover:text-white-text hover:bg-card-on-card transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          {!isExpanded && (
            <div className="mb-8">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          )}

          {/* Two Column Layout */}
          <div className={`grid grid-cols-1 ${isExpanded ? '' : 'lg:grid-cols-12'} gap-8 transition-all duration-300`}>
            {/* Main Content - Left Side */}
            <div className={`transition-all duration-300 ${isExpanded ? 'max-w-4xl mx-auto' : 'lg:col-span-7'}`}>
              {isLoadingMoment ? (
                /* Loading state */
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-light-text">Loading moment...</p>
                </div>
              ) : (
                <>
                  {/* Article Header */}
                  <ArticleHeader
                    title={title}
                    lastUpdated={lastUpdated}
                    characterCount={characterCount}
                    wordCount={wordCount}
                    readTime={readTime}
                    onExpand={handleExpand}
                    onTitleChange={setTitle}
                    saveStatus={saveStatus}
                  />

                  {/* Editor */}
                  <Editor
                    content={editorContent}
                    onUpdate={setEditorContent}
                    onCharacterCountUpdate={setCharacterCount}
                    onWordCountUpdate={setWordCount}
                  />
                </>
              )}
            </div>

            {/* Sidebar - Right Side */}
            <div className={`lg:col-span-5 space-y-6 transition-all duration-300 ${isExpanded ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              <EntityCard {...entityCardData} />
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => {
            setShowToast(false);
            clearStatus();
          }}
        />
      )}
    </div>
  );
}
