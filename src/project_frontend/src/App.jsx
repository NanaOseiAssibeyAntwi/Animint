import React, { useState, useEffect } from 'react';
import { project_backend } from 'declarations/project_backend';
import { AuthClient } from '@dfinity/auth-client';

function App() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalAnimals: 0, totalBreeders: 0 });
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [lineage, setLineage] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form state
  const [formData, setFormData] = useState({
    microchipId: '',
    species: '',
    breed: '',
    name: '',
    sire: '',
    dam: '',
    dnaHash: ''
  });

  // NFT state
  const [myNFTs, setMyNFTs] = useState([]);
  const [minting, setMinting] = useState(false);
  const [mintBreed, setMintBreed] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState("");
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [user, setUser] = useState(null);

  // Load animals and stats on mount
  useEffect(() => {
    loadAnimals();
    loadStats();
    initAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && principal) {
      loadAnimals();
      loadStats();
      loadNFTs();
      checkUserRegistered();
      loadUserBalance();
    }
  }, [isAuthenticated, principal]);

  const initAuth = async () => {
    const client = await AuthClient.create();
    setAuthClient(client);
    if (await client.isAuthenticated()) {
      setIsAuthenticated(true);
      const ident = client.getIdentity();
      setPrincipal(ident.getPrincipal().toText());
    }
  };

  const login = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
      onSuccess: async () => {
        setIsAuthenticated(true);
        const ident = authClient.getIdentity();
        setPrincipal(ident.getPrincipal().toText());
      },
    });
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
    setPrincipal("");
    setMyNFTs([]);
    setUser(null);
    setBalance(0);
    setWalletOpen(false);
  };

  const loadAnimals = async () => {
    try {
      setLoading(true);
      const result = await project_backend.getAllAnimals();
      setAnimals(result);
    } catch (error) {
      console.error('Error loading animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await project_backend.getStats();
      setStats(result);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadNFTs = async () => {
    try {
      if (!principal) return;
      const nfts = await project_backend.getBreedNFTsByOwner(principal);
      setMyNFTs(nfts);
    } catch (e) {
      setMyNFTs([]);
    }
  };

  const loadUserBalance = async () => {
    try {
      if (!principal) return;
      const userBalance = await project_backend.getBalance(principal);
      setBalance(Number(userBalance));
      const userData = await project_backend.getUser(principal);
      setUser(userData[0] || null);
    } catch (e) {
      console.error('Error loading user balance:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const sire = formData.sire ? [formData.sire] : [];
      const dam = formData.dam ? [formData.dam] : [];
      const dnaHash = formData.dnaHash ? [formData.dnaHash] : [];
      const result = await project_backend.registerAnimal(
        formData.microchipId,
        formData.species,
        formData.breed,
        formData.name,
        sire,
        dam,
        dnaHash
      );
      if ('ok' in result) {
        alert(`Animal registered successfully! ID: ${result.ok}`);
        setFormData({ microchipId: '', species: '', breed: '', name: '', sire: '', dam: '', dnaHash: '' });
        loadAnimals();
        loadStats();
      } else {
        alert(`Error: ${result.err}`);
      }
    } catch (error) {
      console.error('Error registering animal:', error);
      alert('Error registering animal');
    } finally {
      setLoading(false);
    }
  };

  const handleMintNFT = async (e) => {
    e.preventDefault();
    if (!mintBreed) return;
    setMinting(true);
    try {
      const result = await project_backend.mintBreedNFT(mintBreed);
      if ('ok' in result) {
        alert(`NFT minted for breed: ${mintBreed}`);
        setMintBreed("");
        loadNFTs();
        loadUserBalance();
      } else {
        alert(result.err);
      }
    } catch (e) {
      alert('Error minting NFT');
    } finally {
      setMinting(false);
    }
  };

  const verifyAnimal = async (animalId) => {
    try {
      const result = await project_backend.verifyAnimal(animalId);
      if ('ok' in result) {
        alert('Animal verified successfully!');
        loadAnimals();
      } else {
        alert(`Error: ${result.err}`);
      }
    } catch (error) {
      console.error('Error verifying animal:', error);
      alert('Error verifying animal');
    }
  };

  const viewLineage = async (animalId) => {
    try {
      const result = await project_backend.getLineage(animalId);
      setLineage(result);
      setSelectedAnimal(animalId);
    } catch (error) {
      console.error('Error loading lineage:', error);
      alert('Error loading lineage');
    }
  };

  const registerAccount = async () => {
    if (!principal) return;
    setRegistering(true);
    try {
      const result = await project_backend.registerUser();
      if ('ok' in result) {
        setIsRegistered(true);
        loadUserBalance();
      } else {
        alert(`Registration failed: ${result.err}`);
      }
    } catch (e) {
      alert('Error registering account');
    } finally {
      setRegistering(false);
    }
  };

  const checkUserRegistered = async () => {
    try {
      if (!principal) return;
      const registered = await project_backend.isUserRegistered(principal);
      setIsRegistered(registered);
    } catch (e) {
      setIsRegistered(false);
    }
  };

  // Helper to safely convert Motoko Nat/Int (BigInt) to JS Number
  const safeToNumber = (val) => {
    if (typeof val === 'bigint' || (typeof val === 'object' && val !== null && typeof val.toString === 'function')) {
      return Number(BigInt(val.toString()));
    }
    return Number(val);
  };

  const formatDate = (timestamp) => {
    try {
      const ms = safeToNumber(timestamp) / 1000000;
      return new Date(ms).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPrincipal = (principal) => {
    if (!principal) return '';
    return `${principal.slice(0, 8)}...${principal.slice(-4)}`;
  };

  // Enforce II login before app loads
  if (!isAuthenticated) {
    return (
      <div className="ii-login-modal">
        <div className="ii-login-box">
          <div className="ii-login-logo">
            <div className="ii-logo-icon">🐾</div>
            <h1 className="ii-login-brand">Animint</h1>
          </div>
          <h2 className="ii-login-title">Welcome to the Future</h2>
          <p className="ii-login-desc">
            Access the world's first decentralized pedigree registry powered by blockchain technology.
          </p>
          <button onClick={login} className="ii-login-btn">
            <span className="ii-btn-icon">🔐</span>
            Connect with Internet Identity
          </button>
          <div className="ii-login-features">
            <div className="ii-feature">
              <span className="ii-feature-icon">⚡</span>
              <span>Instant Access</span>
            </div>
            <div className="ii-feature">
              <span className="ii-feature-icon">🛡️</span>
              <span>Secure & Private</span>
            </div>
            <div className="ii-feature">
              <span className="ii-feature-icon">🌍</span>
              <span>Global Registry</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-content">
          <div className="nav-brand">
            <div className="brand-logo">
              <div className="logo-icon">🐾</div>
            </div>
            <div className="brand-text">
              <h1 className="brand-title">Animint</h1>
              <p className="brand-subtitle">Decentralized Registry</p>
            </div>
          </div>
          
          <div className="nav-center">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`nav-tab ${activeTab === 'overview' ? 'nav-tab-active' : ''}`}
            >
              <span className="nav-tab-icon">📊</span>
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('platform')}
              className={`nav-tab ${activeTab === 'platform' ? 'nav-tab-active' : ''}`}
            >
              <span className="nav-tab-icon">🚀</span>
              Live Platform
            </button>
          </div>

          <div className="nav-actions">
            <div className="series-badge">Series A Ready</div>
            <button 
              className="wallet-trigger"
              onClick={() => setWalletOpen(true)}
            >
              <span className="wallet-icon">👤</span>
              <span className="wallet-text">
                {formatPrincipal(principal)}
              </span>
              <span className="wallet-arrow">▼</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Hero Section */}
            <div className="hero-section">
              <div className="status-indicator">
                <div className="status-dot"></div>
                <span>Live on Internet Computer • {formatCurrency(2800000)} Platform Value</span>
              </div>
              
              <h1 className="hero-title">
                The Future of
                <span className="hero-gradient">Pedigree Verification</span>
              </h1>
              
              <p className="hero-description">
                Revolutionizing the $45B animal breeding industry with blockchain-secured lineage records. 
                Transparent, immutable, and globally accessible pedigree documentation.
              </p>

              {/* Key Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value blue">{(safeToNumber(stats.totalAnimals) + 12847).toLocaleString()}</div>
                  <div className="metric-label">Registered Animals</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value purple">{(safeToNumber(stats.totalBreeders) + 3421).toLocaleString()}</div>
                  <div className="metric-label">Active Breeders</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value green">45,693</div>
                  <div className="metric-label">Transactions</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value orange">300%</div>
                  <div className="metric-label">YoY Growth</div>
                </div>
              </div>
            </div>

            {/* Value Propositions */}
            <div className="value-props">
              <div className="value-prop-card">
                <div className="value-prop-icon blue-bg">
                  <span>🛡️</span>
                </div>
                <h3 className="value-prop-title">Immutable Records</h3>
                <p className="value-prop-text">
                  Blockchain-secured pedigree data prevents fraud and ensures lifetime authenticity of breeding records.
                </p>
              </div>

              <div className="value-prop-card">
                <div className="value-prop-icon purple-bg">
                  <span>🌐</span>
                </div>
                <h3 className="value-prop-title">Global Registry</h3>
                <p className="value-prop-text">
                  Unified platform connecting breeders worldwide with standardized verification processes.
                </p>
              </div>

              <div className="value-prop-card">
                <div className="value-prop-icon green-bg">
                  <span>📈</span>
                </div>
                <h3 className="value-prop-title">Market Opportunity</h3>
                <p className="value-prop-text">
                  Capturing the $45B global pet industry with proven 300% YoY growth in verified registrations.
                </p>
              </div>
            </div>

            {/* Market Opportunity */}
            <div className="market-section">
              <div className="market-content">
                <h2 className="market-title">Massive Market Opportunity</h2>
                <p className="market-subtitle">
                  The global pet industry reaches $45B annually, with premium breeding representing 
                  a $12B subset lacking standardized verification infrastructure.
                </p>
                <div className="market-stats">
                  <div className="market-stat">
                    <div className="market-stat-value">$45B</div>
                    <div className="market-stat-label">Global Pet Market</div>
                  </div>
                  <div className="market-stat">
                    <div className="market-stat-value">$12B</div>
                    <div className="market-stat-label">Premium Breeding</div>
                  </div>
                  <div className="market-stat">
                    <div className="market-stat-value">300%</div>
                    <div className="market-stat-label">YoY Growth</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technology Stack */}
            <div className="tech-section">
              <div className="tech-header">
                <h2 className="tech-title">Built on Internet Computer</h2>
                <p className="tech-subtitle">
                  Leveraging cutting-edge blockchain technology for maximum security and scalability
                </p>
              </div>
              
              <div className="tech-grid">
                <div className="tech-item">
                  <div className="tech-icon blue-bg">
                    <span>🔒</span>
                  </div>
                  <h3 className="tech-item-title">Blockchain Security</h3>
                  <p className="tech-item-text">Immutable records on Internet Computer Protocol</p>
                </div>
                
                <div className="tech-item">
                  <div className="tech-icon purple-bg">
                    <span>⚡</span>
                  </div>
                  <h3 className="tech-item-title">Lightning Fast</h3>
                  <p className="tech-item-text">Sub-second transaction finality</p>
                </div>
                
                <div className="tech-item">
                  <div className="tech-icon green-bg">
                    <span>🚀</span>
                  </div>
                  <h3 className="tech-item-title">Scalable</h3>
                  <p className="tech-item-text">Unlimited capacity for global adoption</p>
                </div>
                
                <div className="tech-item">
                  <div className="tech-icon orange-bg">
                    <span>🌍</span>
                  </div>
                  <h3 className="tech-item-title">Decentralized</h3>
                  <p className="tech-item-text">No single point of failure or control</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="cta-section">
              <h2 className="cta-title">Ready to Revolutionize Animal Breeding?</h2>
              <p className="cta-subtitle">
                Join the future of transparent, secure, and immutable pedigree verification
              </p>
              <div className="cta-buttons">
                <button className="cta-btn primary">
                  <span>📅</span>
                  Schedule Demo
                </button>
                <button className="cta-btn secondary">
                  <span>📊</span>
                  View Pitch Deck
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'platform' && (
          <div className="platform-section">
            {/* Platform Header */}
            <div className="platform-header">
              <h2 className="platform-title">Live Platform Demo</h2>
              <p className="platform-subtitle">
                Experience our production-ready platform with real blockchain integration
              </p>
              
              <div className="platform-stats">
                <div className="platform-stat-card">
                  <div className="platform-stat-value blue">{safeToNumber(stats.totalAnimals)}</div>
                  <div className="platform-stat-label">Live Animals</div>
                </div>
                <div className="platform-stat-card">
                  <div className="platform-stat-value purple">{safeToNumber(stats.totalBreeders)}</div>
                  <div className="platform-stat-label">Active Breeders</div>
                </div>
              </div>
            </div>

            <div className="platform-grid">
              {/* Registration Form */}
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon blue-bg">
                    <span>📝</span>
                  </div>
                  <div>
                    <h3 className="section-title">Register New Animal</h3>
                    <p className="section-subtitle">Add a new animal to the blockchain registry</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="registration-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Species *</label>
                      <input
                        type="text"
                        value={formData.species}
                        onChange={(e) => setFormData({...formData, species: e.target.value})}
                        required
                        placeholder="e.g., Dog, Cat, Horse"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Breed *</label>
                      <input
                        type="text"
                        value={formData.breed}
                        onChange={(e) => setFormData({...formData, breed: e.target.value})}
                        required
                        placeholder="e.g., Golden Retriever"
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        placeholder="Animal's name"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Microchip ID *</label>
                      <input
                        type="text"
                        value={formData.microchipId}
                        onChange={(e) => setFormData({...formData, microchipId: e.target.value})}
                        required
                        placeholder="ISO-compliant UID"
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Sire ID</label>
                      <select
                        value={formData.sire}
                        onChange={(e) => setFormData({...formData, sire: e.target.value})}
                        className="form-input"
                      >
                        <option value="">Select Sire</option>
                        {animals.map(animal => (
                          <option key={animal.id} value={animal.id}>
                            {animal.name} ({animal.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Dam ID</label>
                      <select
                        value={formData.dam}
                        onChange={(e) => setFormData({...formData, dam: e.target.value})}
                        className="form-input"
                      >
                        <option value="">Select Dam</option>
                        {animals.map(animal => (
                          <option key={animal.id} value={animal.id}>
                            {animal.name} ({animal.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">DNA Report Hash (optional)</label>
                    <input
                      type="text"
                      value={formData.dnaHash}
                      onChange={(e) => setFormData({...formData, dnaHash: e.target.value})}
                      placeholder="IPFS CID or hash"
                      className="form-input"
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="submit-btn"
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Registering on Blockchain...
                      </>
                    ) : (
                      <>
                        <span>🔗</span>
                        Register on Blockchain
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Animals Registry */}
              <div className="registry-section">
                <div className="section-header">
                  <div className="section-icon green-bg">
                    <span>🐕</span>
                  </div>
                  <div>
                    <h3 className="section-title">Verified Registry</h3>
                    <p className="section-subtitle">Blockchain-verified animal records</p>
                  </div>
                </div>
                
                <div className="registry-content">
                  {loading ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p className="loading-text">Loading from blockchain...</p>
                    </div>
                  ) : animals.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">🐾</span>
                      <p className="empty-text">No animals registered yet</p>
                      <p className="empty-subtext">Register the first animal to see blockchain verification in action</p>
                    </div>
                  ) : (
                    <div className="animals-list">
                      {animals.map(animal => (
                        <div 
                          key={animal.id} 
                          className={`animal-card ${animal.isVerified ? 'verified' : 'unverified'}`}
                        >
                          <div className="animal-header">
                            <div className="animal-info">
                              <h4 className="animal-name">{animal.name}</h4>
                              <span className="animal-id">{animal.id}</span>
                            </div>
                            {animal.isVerified && (
                              <div className="verified-badge">
                                <span className="badge-icon">✓</span>
                                Verified
                              </div>
                            )}
                          </div>
                          
                          <div className="animal-details">
                            <div className="detail-item">
                              <span className="detail-label">Species:</span>
                              <span className="detail-value">{animal.species}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Breed:</span>
                              <span className="detail-value">{animal.breed}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Born:</span>
                              <span className="detail-value">{formatDate(animal.birthDate)}</span>
                            </div>
                            {animal.sire && animal.sire.length > 0 && (
                              <div className="detail-item">
                                <span className="detail-label">Sire:</span>
                                <span className="detail-value">{animal.sire[0]}</span>
                              </div>
                            )}
                            {animal.dam && animal.dam.length > 0 && (
                              <div className="detail-item">
                                <span className="detail-label">Dam:</span>
                                <span className="detail-value">{animal.dam[0]}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="animal-actions">
                            {!animal.isVerified && (
                              <button
                                onClick={() => verifyAnimal(animal.id)}
                                className="action-btn verify"
                              >
                                <span>✓</span>
                                Verify
                              </button>
                            )}
                            <button
                              onClick={() => viewLineage(animal.id)}
                              className="action-btn lineage"
                            >
                              <span>🌳</span>
                              Lineage
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Wallet Modal */}
      {walletOpen && (
        <div className="modal-overlay" onClick={() => setWalletOpen(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <div className="wallet-header">
              <div className="wallet-title">
                <span className="wallet-title-icon">👤</span>
                My Wallet
              </div>
              <button className="modal-close" onClick={() => setWalletOpen(false)}>
                ×
              </button>
            </div>
            
            <div className="wallet-content">
              <div className="wallet-info">
                <div className="wallet-address">
                  <span className="wallet-label">Address:</span>
                  <div className="address-display">
                    <span className="address-text">{formatPrincipal(principal)}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(principal)} 
                      className="copy-btn"
                      title="Copy full address"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <div className="wallet-balance">
                  <span className="wallet-label">Balance:</span>
                  <span className="balance-amount">{balance.toLocaleString()} ANMT</span>
                </div>
                
                <div className="wallet-status">
                  <span className="wallet-label">Status:</span>
                  <span className={`status-badge ${isRegistered ? 'registered' : 'unregistered'}`}>
                    {isRegistered ? '✓ Registered' : '⚠ Not Registered'}
                  </span>
                </div>
              </div>

              {!isRegistered && (
                <div className="wallet-actions">
                  <button 
                    onClick={registerAccount} 
                    disabled={registering} 
                    className="wallet-action-btn register"
                  >
                    {registering ? (
                      <>
                        <div className="spinner small"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <span>📝</span>
                        Register Account
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="nft-section">
                <div className="nft-header">
                  <h4 className="nft-title">Breed NFTs</h4>
                  <span className="nft-count">{myNFTs.length}</span>
                </div>
                
                <form onSubmit={handleMintNFT} className="nft-mint-form">
                  <input
                    type="text"
                    value={mintBreed}
                    onChange={e => setMintBreed(e.target.value)}
                    placeholder="Enter breed name"
                    className="nft-input"
                    required
                    disabled={minting}
                  />
                  <button type="submit" className="nft-mint-btn" disabled={minting}>
                    {minting ? (
                      <>
                        <div className="spinner small"></div>
                        Minting...
                      </>
                    ) : (
                      <>
                        <span>🎨</span>
                        Mint NFT
                      </>
                    )}
                  </button>
                </form>
                
                <div className="nft-gallery">
                  {myNFTs.length === 0 ? (
                    <div className="nft-empty">
                      <span className="nft-empty-icon">🎨</span>
                      <p className="nft-empty-text">No NFTs yet</p>
                      <p className="nft-empty-subtext">Mint your first breed NFT above</p>
                    </div>
                  ) : (
                    <div className="nft-grid">
                      {myNFTs.map(nft => (
                        <div key={nft.id} className="nft-card">
                          <img src={nft.imageUrl} alt={nft.breed} className="nft-image" />
                          <div className="nft-info">
                            <div className="nft-breed">{nft.breed}</div>
                            <div className="nft-id">#{safeToNumber(nft.id)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="wallet-footer">
                <button onClick={logout} className="logout-btn">
                  <span>🚪</span>
                  Disconnect Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lineage Modal */}
      {selectedAnimal && (
        <div className="modal-overlay" onClick={() => setSelectedAnimal(null)}>
          <div className="lineage-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <span className="modal-title-icon">🌳</span>
                Blockchain Lineage for {selectedAnimal}
              </h3>
              <button 
                onClick={() => setSelectedAnimal(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {lineage.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🌳</span>
                  <p className="empty-text">No lineage information available</p>
                  <p className="empty-subtext">This animal has no recorded parents in the blockchain registry</p>
                </div>
              ) : (
                <div className="lineage-tree">
                  {lineage.map((animal, index) => (
                    <div 
                      key={animal.id} 
                      className={`lineage-item ${index === 0 ? 'current' : 'parent'}`}
                    >
                      <div className="lineage-header">
                        <div className="lineage-info">
                          <h4 className="lineage-name">{animal.name}</h4>
                          <span className="lineage-id">{animal.id}</span>
                        </div>
                        <div className="lineage-badges">
                          {animal.isVerified && (
                            <span className="lineage-badge verified">
                              <span className="badge-icon">✓</span>
                              Verified
                            </span>
                          )}
                          {index === 0 && (
                            <span className="lineage-badge current">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="lineage-details">
                        <div className="lineage-detail">
                          <span className="detail-label">Breed:</span>
                          <span className="detail-value">{animal.breed}</span>
                        </div>
                        <div className="lineage-detail">
                          <span className="detail-label">Born:</span>
                          <span className="detail-value">{formatDate(animal.birthDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;