import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { 
  FiPlus, FiMinus, FiEdit, FiEye, FiEyeOff, 
  FiTrash2, FiSave, FiArrowUp, FiArrowDown, 
  FiChevronLeft, FiChevronRight, FiAlertCircle 
} from 'react-icons/fi';

export default function Home() {
  const [blocks, setBlocks] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState([{ text: '', link: '' }]);
  const [images, setImages] = useState([{ file: null, url: '' }]);
  const [information, setInformation] = useState('');
  const [tags, setTags] = useState([]);
  const [sourceLinks, setSourceLinks] = useState(['']);
  const [visibility, setVisibility] = useState('show');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState([]);
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('recent-updated');
  const [showSections, setShowSections] = useState({
    title: true,
    steps: false,
    images: false,
    information: false,
    tags: false,
    sources: false
  });
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        // Try to load blocks data
        const blocksRes = await fetch('/api/github?path=data/airdrop/data.json');
        if (!blocksRes.ok) throw new Error('Failed to fetch blocks data');
        
        const blocksData = await blocksRes.json();
        if (blocksData.content) {
          try {
            // Directly parse the JSON content (no more base64 decoding)
            const content = blocksData.content;
            const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
            setBlocks(parsedContent);
          } catch (parseError) {
            console.error('Error parsing blocks data:', parseError);
            setBlocks([]);
          }
        } else {
          setBlocks([]);
        }

        // Try to load tags data
        const tagsRes = await fetch('/api/github?path=data/tags/tags.json');
        if (!tagsRes.ok) throw new Error('Failed to fetch tags data');
        
        const tagsData = await tagsRes.json();
        if (tagsData.content) {
          try {
            // Directly parse the JSON content for tags
            const tagsContent = typeof tagsData.content === 'string' ? JSON.parse(tagsData.content) : tagsData.content;
            setAllTags(tagsContent);
          } catch (parseError) {
            console.error('Error parsing tags data:', parseError);
            setAllTags(["daily", "WL", "retro", "testnet"]);
          }
        } else {
          setAllTags(["daily", "WL", "retro", "testnet"]);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setLoadError(error.message);
        setMessage(`❌ ${error.message}`);
        setBlocks([]);
        setAllTags(["daily", "WL", "retro", "testnet"]);
      } finally {
        setIsLoading(false);
      }
    };

    if (process.env.NEXT_PUBLIC_GITHUB_OWNER && process.env.NEXT_PUBLIC_GITHUB_REPO) {
      fetchData();
    } else {
      setLoadError('GitHub configuration missing');
      setMessage('❌ GitHub configuration missing');
    }
  }, []);
  
  const getImageDisplayUrl = (imgPath) => {
    if (!imgPath) return '';
    if (imgPath.startsWith('http')) return imgPath;
    if (!process.env.NEXT_PUBLIC_GITHUB_OWNER || !process.env.NEXT_PUBLIC_GITHUB_REPO) {
      console.error('GitHub repository details not configured');
      return '';
    }
    const branch = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main';
    return `https://raw.githubusercontent.com/${process.env.NEXT_PUBLIC_GITHUB_OWNER}/${process.env.NEXT_PUBLIC_GITHUB_REPO}/${branch}/${imgPath}`.replace(/\s+/g, '');
  };

  // Steps management
  const addStep = () => setSteps([...steps, { text: '', link: '' }]);
  const removeStep = (index) => {
    if (steps.length > 1) {
      const newSteps = [...steps];
      newSteps.splice(index, 1);
      setSteps(newSteps);
    }
  };
  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };
  const moveStepUp = (index) => {
    if (index <= 0) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
    setSteps(newSteps);
  };
  const moveStepDown = (index) => {
    if (index >= steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
  };

  // Images management
  const addImage = () => setImages([...images, { file: null, url: '' }]);
  const removeImage = (index) => {
    if (images.length > 1) {
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
    }
  };
  const updateImage = (index, field, value) => {
    const newImages = [...images];
    newImages[index][field] = value;
    setImages(newImages);
  };
  const handleImageUpload = (e, index) => {
    if (e.target.files && e.target.files[0]) {
      const newImages = [...images];
      newImages[index].file = e.target.files[0];
      newImages[index].url = '';
      setImages(newImages);
    }
  };

// left right arrow buttons
const handlePrevImage = (blockIndex) => {
  if (blocks[blockIndex].images.length <= 1) return; // Tambahkan pengecekan ini
  setCurrentImageIndex((prev) => {
    const newIndexes = [...prev];
    newIndexes[blockIndex] =
      (newIndexes[blockIndex] - 1 + blocks[blockIndex].images.length) %
      blocks[blockIndex].images.length;
    return newIndexes;
  });
};

const handleNextImage = (blockIndex) => {
  if (blocks[blockIndex].images.length <= 1) return; // Tambahkan pengecekan ini
  setCurrentImageIndex((prev) => {
    const newIndexes = [...prev];
    newIndexes[blockIndex] =
      (newIndexes[blockIndex] + 1) % blocks[blockIndex].images.length;
    return newIndexes;
  });
};

  // Sources management
  const addSourceLink = () => setSourceLinks([...sourceLinks, '']);
  const removeSourceLink = (index) => {
    if (sourceLinks.length > 1) {
      const newLinks = [...sourceLinks];
      newLinks.splice(index, 1);
      setSourceLinks(newLinks);
    }
  };
  const updateSourceLink = (index, value) => {
    const newLinks = [...sourceLinks];
    newLinks[index] = value;
    setSourceLinks(newLinks);
  };

  // Tags management
  const handleTagToggle = (tag) => {
    setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]);
  };

  const toggleTagFilter = (tag) => {
    setFilterTags(filterTags.includes(tag) ? filterTags.filter(t => t !== tag) : [...filterTags, tag]);
  };

  // Section toggles
  const toggleSection = (section) => {
    setShowSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Image slider navigation
  const nextImage = (blockId) => {
    setCurrentImageIndices(prev => ({
      ...prev,
      [blockId]: prev[blockId] >= blocks.find(b => b.id === blockId).images.length - 1 ? 0 : (prev[blockId] || 0) + 1
    }));
  };

  const prevImage = (blockId) => {
    setCurrentImageIndices(prev => ({
      ...prev,
      [blockId]: prev[blockId] <= 0 ? blocks.find(b => b.id === blockId).images.length - 1 : (prev[blockId] || 0) - 1
    }));
  };

  const saveBlock = async () => {
  if (!title.trim()) {
    setMessage('❌ Title is required');
    return;
  }

  setIsLoading(true);
  setMessage('');
  const now = new Date().toISOString();
  const uploadedImages = [];
  
  // Upload images
  for (const img of images) {
    if (img.file) {
      try {
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(img.file);
        });

        const fileName = img.file.name.replace(/\s+/g, '-').toLowerCase();
        const uploadRes = await fetch('/api/github?upload=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64Data,
            path: `data/images/${fileName}`,
            message: `Upload image ${fileName}`
          }),
        });

        if (uploadRes.ok) {
          uploadedImages.push(`data/images/${fileName}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    } else if (img.url.trim() !== '') {
      uploadedImages.push(img.url);
    }
  }

  // Process information field to handle special characters and emojis
  let processedInformation = information;
  try {
    // Try to parse as JSON if it looks like JSON
    if (information.trim().startsWith('{') || information.trim().startsWith('[')) {
      processedInformation = JSON.parse(information);
    } else {
      // Handle as plain text with line breaks
      processedInformation = information.split('\n').filter(line => line.trim() !== '');
    }
  } catch (e) {
    // If parsing fails, keep as is
    processedInformation = information;
  }

  const blockData = {
    id: editingId || Date.now().toString(),
    title: title,
    steps: showSections.steps ? steps.filter(step => step.text.trim() !== '') : [],
    information: showSections.information ? processedInformation : [],
    tags: showSections.tags ? tags : [],
    sourceLinks: showSections.sources ? sourceLinks.filter(link => link.trim() !== '') : [],
    images: showSections.images ? uploadedImages : [],
    visibility,
    createdAt: editingId ? blocks.find(b => b.id === editingId)?.createdAt || now : now,
    updatedAt: now
  };

  completeSave(blockData);
};

const completeSave = async (blockData) => {
  const updatedBlocks = editingId
    ? blocks.map(b => b.id === editingId ? blockData : b)
    : [...blocks, blockData];

  try {
    // Stringify with pretty print
    const jsonContent = JSON.stringify(updatedBlocks, null, 2);

    const res = await fetch('/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'data/airdrop/data.json',
        content: jsonContent, // Send as plain JSON string
        message: editingId ? `Update block ${editingId}` : 'Add new block'
      }),
    });

    if (res.ok) {
      setBlocks(updatedBlocks);
      resetForm();
      setMessage(`✅ Block ${editingId ? 'updated' : 'added'} successfully!`);
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save data');
    }
  } catch (error) {
    console.error('Error saving data:', error);
    setMessage(`❌ ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

  // Update editBlock to handle information field properly
  const editBlock = (id) => {
  const block = blocks.find(b => b.id === id);
  if (block) {
    setTitle(block.title);
    setSteps(block.steps.length > 0 ? block.steps : [{ text: '', link: '' }]);
    setImages(block.images?.length > 0 
      ? block.images.map(img => ({ 
          file: null, 
          url: img.startsWith('http') ? img : getImageDisplayUrl(img)
        }))
      : [{ file: null, url: '' }]
    );
    
    // Handle information field - if array, join with newlines; if object, stringify
    let infoValue = '';
    if (Array.isArray(block.information)) {
      infoValue = block.information.join('\n');
    } else if (typeof block.information === 'object' && block.information !== null) {
      infoValue = JSON.stringify(block.information, null, 2);
    } else {
      infoValue = block.information || '';
    }
    setInformation(infoValue);
    
    setTags(block.tags || []);
    setSourceLinks(block.sourceLinks?.length > 0 ? block.sourceLinks : ['']);
    setVisibility(block.visibility || 'show');
    setEditingId(id);
    setShowSections({
      title: true,
      steps: block.steps.length > 0,
      images: block.images?.length > 0,
      information: block.information?.length > 0,
      tags: block.tags?.length > 0,
      sources: block.sourceLinks?.length > 0
    });
  }
};

  const deleteBlock = async (id) => {
    if (confirm('Are you sure you want to delete this block?')) {
      setIsLoading(true);
      const updatedBlocks = blocks.filter(b => b.id !== id);
      try {
        const jsonContent = JSON.stringify(updatedBlocks, null, 2);
        const utf8Content = unescape(encodeURIComponent(jsonContent));
        const base64Content = btoa(utf8Content);

        const res = await fetch('/api/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'data/airdrop/data.json',
            content: base64Content,
            message: `Delete block ${id}`
          }),
        });

        if (res.ok) {
          setBlocks(updatedBlocks);
          if (editingId === id) resetForm();
          setMessage('✅ Block deleted successfully!');
        } else {
          throw new Error('Failed to delete block');
        }
      } catch (error) {
        console.error('Error deleting block:', error);
        setMessage('❌ Failed to delete block. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleVisibility = async (id) => {
    setIsLoading(true);
    const updatedBlocks = blocks.map(b => {
      if (b.id === id) {
        return {
          ...b,
          visibility: b.visibility === 'show' ? 'hide' : 'show',
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });

    try {
      const jsonContent = JSON.stringify(updatedBlocks, null, 2);
      const utf8Content = unescape(encodeURIComponent(jsonContent));
      const base64Content = btoa(utf8Content);

      const res = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'data/airdrop/data.json',
          content: base64Content,
          message: `Toggle visibility for block ${id}`
        }),
      });

      if (res.ok) {
        setBlocks(updatedBlocks);
        setMessage(`✅ Block ${updatedBlocks.find(b => b.id === id).visibility === 'show' ? 'shown' : 'hidden'} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      setMessage('❌ Failed to toggle visibility. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredBlocks = () => {
    let filteredBlocks = [...blocks];
    
    if (showHiddenOnly) {
      filteredBlocks = filteredBlocks.filter(block => block.visibility === 'hide');
    }
    
    if (searchTerm) {
      filteredBlocks = filteredBlocks.filter(block =>
        block.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterTags.length > 0) {
      filteredBlocks = filteredBlocks.filter(block =>
        block.tags && filterTags.every(tag => block.tags.includes(tag))
      );
    }
    
    switch (filter) {
      case 'recent-updated':
        return filteredBlocks.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
      case 'latest':
        return filteredBlocks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return filteredBlocks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'a-z':
        return filteredBlocks.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return filteredBlocks.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return filteredBlocks;
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Airdrop Editor</title>
        <meta name="description" content="Airdrop content editor" />
      </Head>

      <header className={styles.header}>
        <h1>Airdrop Editor</h1>
        {loadError && (
          <div className={styles.loadErrorBanner}>
            <FiAlertCircle /> Warning: {loadError} - You can still edit and save changes
          </div>
        )}
      </header>

      <div className={styles.mainContent}>
        <div className={styles.editorSection}>
          <form onSubmit={(e) => { e.preventDefault(); saveBlock(); }} className={styles.form}>
            <h2>{editingId ? 'Edit Block' : 'Add New Block'}</h2>
            
            <div className={styles.sectionToggle}>
              <button 
                type="button" 
                onClick={() => toggleSection('title')}
                className={styles.toggleButton}
              >
                {showSections.title ? 'Hide' : 'Show'} Title
              </button>
            </div>
            {showSections.title && (
              <div className={styles.formGroup}>
                <label>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Block title"
                  required
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.sectionToggle}>
              <button 
                type="button" 
                onClick={() => toggleSection('steps')}
                className={styles.toggleButton}
              >
                {showSections.steps ? 'Hide' : 'Show'} Steps
              </button>
            </div>
            {showSections.steps && (
              <div className={styles.formGroup}>
                <label>Steps</label>
                {steps.map((step, index) => (
                  <div key={index} className={styles.stepRow}>
                    <div className={styles.stepControls}>
                      <button
                        type="button"
                        onClick={() => moveStepUp(index)}
                        disabled={index === 0}
                        className={styles.moveButton}
                        title="Move up"
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStepDown(index)}
                        disabled={index === steps.length - 1}
                        className={styles.moveButton}
                        title="Move down"
                      >
                        <FiArrowDown />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={step.text}
                      onChange={(e) => updateStep(index, 'text', e.target.value)}
                      placeholder="Step description"
                      className={styles.input}
                    />
                    <input
                      type="url"
                      value={step.link}
                      onChange={(e) => updateStep(index, 'link', e.target.value)}
                      placeholder="Link (optional)"
                      className={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      disabled={steps.length <= 1}
                      className={styles.stepButton}
                    >
                      <FiMinus />
                    </button>
                    {index === steps.length - 1 && (
                      <button
                        type="button"
                        onClick={addStep}
                        className={styles.stepButton}
                      >
                        <FiPlus />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.sectionToggle}>
              <button 
                type="button" 
                onClick={() => toggleSection('images')}
                className={styles.toggleButton}
              >
                {showSections.images ? 'Hide' : 'Show'} Images
              </button>
            </div>
            {showSections.images && (
              <div className={styles.formGroup}>
                <label>Images</label>
                {images.map((img, index) => (
                  <div key={index} className={styles.imageInputContainer}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, index)}
                      className={styles.input}
                    />
                    <p className={styles.imageOrText}>OR</p>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Image URL"
                      value={img.url}
                      onChange={(e) => updateImage(index, 'url', e.target.value)}
                    />
                    <div className={styles.imageControls}>
                      <button 
                        type="button"
                        className={styles.stepButton} 
                        onClick={() => removeImage(index)}
                        disabled={images.length <= 1}
                      >
                        <FiMinus />
                      </button>
                      {index === images.length - 1 && (
                        <button type="button" className={styles.stepButton} onClick={addImage}>
                          <FiPlus />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.sectionToggle}>
              <button 
                type="button" 
                onClick={() => toggleSection('information')}
                className={styles.toggleButton}
              >
                {showSections.information ? 'Hide' : 'Show'} Information
              </button>
            </div>
            {showSections.information && (
              <div className={styles.formGroup}>
                <label>Additional Information</label>
                <textarea
                  value={information}
                  onChange={(e) => setInformation(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                  className={styles.textarea}
                />
              </div>
            )}

            <div className={styles.sectionToggle}>
              <button 
                type="button" 
                onClick={() => toggleSection('tags')}
                className={styles.toggleButton}
              >
                {showSections.tags ? 'Hide' : 'Show'} Tags
              </button>
            </div>
            {showSections.tags && allTags.length > 0 && (
              <div className={styles.formGroup}>
                <label>Tags</label>
                <div className={styles.tagsContainer}>
                  {allTags.map(tag => (
                    <label key={tag} className={styles.tagLabel}>
                      <input
                        type="checkbox"
                        checked={tags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className={styles.tagCheckbox}
                      />
                      <span className={styles.tagText}>{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.sectionToggle}>
              <button 
                type="button" 
                onClick={() => toggleSection('sources')}
                className={styles.toggleButton}
              >
                {showSections.sources ? 'Hide' : 'Show'} Sources
              </button>
            </div>
            {showSections.sources && (
              <div className={styles.formGroup}>
                <label>Source Links</label>
                {sourceLinks.map((link, index) => (
                  <div key={index} className={styles.sourceRow}>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateSourceLink(index, e.target.value)}
                      placeholder="Source URL"
                      className={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => removeSourceLink(index)}
                      disabled={sourceLinks.length <= 1}
                      className={styles.stepButton}
                    >
                      <FiMinus />
                    </button>
                    {index === sourceLinks.length - 1 && (
                      <button
                        type="button"
                        onClick={addSourceLink}
                        className={styles.stepButton}
                      >
                        <FiPlus />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Visibility *</label>
              <div className={styles.visibilityOptions}>
                <label className={styles.visibilityLabel}>
                  <input
                    type="radio"
                    name="visibility"
                    value="show"
                    checked={visibility === 'show'}
                    onChange={() => setVisibility('show')}
                    className={styles.visibilityRadio}
                  />
                  <span>Show on public site</span>
                </label>
                <label className={styles.visibilityLabel}>
                  <input
                    type="radio"
                    name="visibility"
                    value="hide"
                    checked={visibility === 'hide'}
                    onChange={() => setVisibility('hide')}
                    className={styles.visibilityRadio}
                  />
                  <span>Hide from public site</span>
                </label>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : (editingId ? 'Update' : 'Add') + ' Block'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {message && (
            <div className={message.startsWith('✅') ? styles.successMessage : styles.errorMessage}>
              {message}
            </div>
          )}
        </div>

        <div className={styles.displaySection}>
          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              <label>Search: </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by title..."
                className={styles.filterInput}
              />
            </div>
            
            {allTags.length > 0 && (
              <div className={styles.filterGroup}>
                <label>Filter by tags: </label>
                <div className={styles.tagFilterContainer}>
                  {allTags.map(tag => (
                    <label key={tag} className={styles.tagFilterLabel}>
                      <input
                        type="checkbox"
                        checked={filterTags.includes(tag)}
                        onChange={() => toggleTagFilter(tag)}
                        className={styles.tagFilterCheckbox}
                      />
                      <span className={styles.tagFilterText}>{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className={styles.filterGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={showHiddenOnly}
                  onChange={() => setShowHiddenOnly(!showHiddenOnly)}
                />
                Show only hidden
              </label>
            </div>
            
            <div className={styles.filterGroup}>
              <label>Sort by: </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="recent-updated">Latest updated</option>
                <option value="latest">New added</option>
                <option value="oldest">Oldest added</option>
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
              </select>
            </div>
          </div>

          <h2>Available Blocks ({getFilteredBlocks().length})</h2>

          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : blocks.length > 0 ? (
            <div className={styles.itemsGrid}>
              {getFilteredBlocks().map((block) => (
                <div 
                  key={block.id} 
                  className={`${styles.itemCard} ${block.visibility === 'hide' ? styles.hiddenItem : ''}`}
                >
                  <div className={styles.itemHeader}>
                    <h3>{block.title}</h3>
                    <div className={styles.itemActions}>
                      <button
                        onClick={() => toggleVisibility(block.id)}
                        className={block.visibility === 'hide' ? styles.showButton : styles.hideButton}
                      >
                        {block.visibility === 'hide' ? <FiEye /> : <FiEyeOff />}
                        {block.visibility === 'hide' ? ' Show' : ' Hide'}
                      </button>
                      <button
                        onClick={() => editBlock(block.id)}
                        className={styles.editButton}
                      >
                        <FiEdit /> Edit
                      </button>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className={styles.deleteButton}
                      >
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </div>

                  {block.images?.length > 0 && (
  <div className={styles.imageSliderContainer}>
    <div className={styles.imageSlider}>
      {block.images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevImage(block.id);
          }}
          className={styles.sliderArrow}
        >
          <FiChevronLeft />
        </button>
      )}

      <div className={styles.sliderImageWrapper}>
        <img
          src={getImageDisplayUrl(block.images[currentImageIndices[block.id] || 0])}
          alt={`${block.title} image ${(currentImageIndices[block.id] || 0) + 1}`}
          className={styles.sliderImage}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div className={styles.imageError} style={{ display: 'none' }}>
          Image failed to load
        </div>
      </div>

      {block.images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextImage(block.id);
          }}
          className={styles.sliderArrow}
        >
          <FiChevronRight />
        </button>
      )}
    </div>

    {block.images.length > 1 && (
      <div className={styles.sliderDots}>
        {block.images.map((_, index) => (
          <span
            key={index}
            className={`${styles.dot} ${
              index === (currentImageIndices[block.id] || 0) ? styles.activeDot : ''
            }`}
            onClick={() =>
              setCurrentImageIndices((prev) => ({
                ...prev,
                [block.id]: index,
              }))
            }
          />
        ))}
      </div>
    )}
  </div>
)}

                  {block.steps?.length > 0 && (
                    <div className={styles.stepsList}>
                      <h4>Steps:</h4>
                      <ol>
                        {block.steps.map((step, i) => (
                          <li key={i}>
                            {step.text}
                            {step.link && (
                              <a
                                href={step.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.stepLink}
                              >
                                (Link)
                              </a>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {block.information?.length > 0 && (
    <div className={styles.additionalInfo}>
      <h4>Information:</h4>
      {Array.isArray(block.information) ? (
        block.information.map((line, i) => (
          <p key={i}>{line}</p>
        ))
      ) : (
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
          {typeof block.information === 'string'
            ? block.information
            : JSON.stringify(block.information, null, 2)}
        </pre>
      )}
    </div>
  )}

  {block.tags?.length > 0 && (
    <div className={styles.itemTags}>
      {block.tags.map(tag => (
        <span key={tag} className={styles.tagPill}>{tag}</span>
      ))}
    </div>
  )}

  {block.sourceLinks?.length > 0 && (
    <div className={styles.itemSources}>
      {block.sourceLinks.map((link, i) => (
        <a
          key={i}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sourceLink}
        >
          {link}
        </a>
      ))}
    </div>
  )}

                  <div className={styles.itemMeta}>
                    <div className={styles.metaRow}>
                      {block.updatedAt && (
                        <small>Updated: {new Date(block.updatedAt).toLocaleDateString()}</small>
                      )}
                    </div>
                    <div className={styles.metaRow}>
                      <small>Added: {new Date(block.createdAt).toLocaleDateString()}</small>
                    </div>
                    {block.visibility === 'hide' && (
                      <div className={styles.metaRow}>
                        <small className={styles.hiddenBadge}>HIDDEN</small>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No blocks available yet</p>
              <p>Add your first block using the form</p>
            </div>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} All rights reserved</p>
      </footer>
    </div>
  );
}
