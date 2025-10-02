const { createApp } = Vue;

createApp({
    data() {
        return {
            isLoggedIn: false,
            isLoading: false,
            isSaving: false,
            loginError: '',
            saveMessage: '',
            saveSuccess: false,
            lastUpdated: 'Never',
            loginForm: {
                username: '',
                password: ''
            },
            competitions: [],
            allPlayers: {}, // Store all players for each competition
            originalPlayers: {}, // Store original players for reset
            showAddPlayerModal: false,
            showEditPlayerModal: false,
            newPlayer: {
                competition_id: null,
                name: '',
                score: 0
            },
            editingPlayer: {
                id: null,
                name: '',
                score: 0,
                competition_id: null
            },
            ws: null,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5
        };
    },
    mounted() {
        this.checkAuth();
    },
    
    beforeUnmount() {
        this.cleanupWebSocket();
    },
    methods: {
        async login() {
            this.isLoading = true;
            this.loginError = '';
            
            try {
                const credentials = btoa(`${this.loginForm.username}:${this.loginForm.password}`);
                const response = await fetch('/api/competitions', {
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });
                
                if (response.ok) {
                    this.isLoggedIn = true;
                    this.loginForm = { username: '', password: '' };
                    this.lastUpdated = new Date().toLocaleTimeString();
                    await this.fetchCompetitions();
                    this.initWebSocket();
                } else {
                    this.loginError = 'Invalid username or password';
                }
            } catch (error) {
                console.error('Login error:', error);
                this.loginError = 'Login failed. Please try again.';
            } finally {
                this.isLoading = false;
            }
        },
        
        logout() {
            this.cleanupWebSocket();
            this.isLoggedIn = false;
            this.competitions = [];
            this.allPlayers = {};
            this.originalPlayers = {};
            this.saveMessage = '';
            this.loginError = '';
            this.lastUpdated = 'Never';
            this.showAddPlayerModal = false;
            this.showEditPlayerModal = false;
            this.newPlayer = { competition_id: null, name: '', score: 0 };
            this.editingPlayer = { id: null, name: '', score: 0, competition_id: null };
            localStorage.removeItem('isAdminLoggedIn');
        },
        
        checkAuth() {
            const isAuthenticated = localStorage.getItem('isAdminLoggedIn');
            if (isAuthenticated === 'true') {
                this.isLoggedIn = true;
                this.fetchCompetitions();
                this.initWebSocket();
            }
        },
        
        initWebSocket() {
            try {
                this.ws = new WebSocket('ws://localhost:3000/ws');
                
                this.ws.onopen = () => {
                    console.log('Admin WebSocket connected');
                    this.reconnectAttempts = 0;
                };
                
                this.ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    console.log('Admin received message:', message);
                    
                    if (message.type === 'init' || message.type === 'update') {
                        // Refresh competitions and players data
                        this.competitions = message.data;
                        this.lastUpdated = new Date().toLocaleTimeString();
                        
                        // Fetch updated players for each competition
                        for (const competition of this.competitions) {
                            this.fetchPlayersForCompetition(competition.id);
                        }
                    }
                };
                
                this.ws.onclose = () => {
                    console.log('Admin WebSocket disconnected');
                    this.attemptReconnect();
                };
                
                this.ws.onerror = (error) => {
                    console.error('Admin WebSocket error:', error);
                };
                
            } catch (error) {
                console.error('Failed to initialize Admin WebSocket:', error);
                this.attemptReconnect();
            }
        },
        
        cleanupWebSocket() {
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
        },
        
        attemptReconnect() {
            if (this.reconnectAttempts < this.maxReconnectAttempts && this.isLoggedIn) {
                this.reconnectAttempts++;
                console.log(`Admin attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                
                setTimeout(() => {
                    this.initWebSocket();
                }, 3000);
            } else {
                console.error('Admin max reconnection attempts reached');
            }
        },
        
        async fetchCompetitions() {
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch('/api/competitions', {
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.competitions = data;
                    this.lastUpdated = new Date().toLocaleTimeString();
                    
                    // Fetch all players for each competition
                    for (const competition of this.competitions) {
                        await this.fetchPlayersForCompetition(competition.id);
                    }
                    
                    localStorage.setItem('isAdminLoggedIn', 'true');
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Error fetching competitions:', error);
                this.logout();
            }
        },
        
        async fetchPlayersForCompetition(competitionId) {
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch(`/api/players?competition_id=${competitionId}`, {
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });
                
                if (response.ok) {
                    const players = await response.json();
                    this.allPlayers[competitionId] = players;
                    this.originalPlayers[competitionId] = JSON.parse(JSON.stringify(players));
                }
            } catch (error) {
                console.error('Error fetching players for competition:', competitionId, error);
            }
        },
        
        getPlayersForCompetition(competitionId) {
            return this.allPlayers[competitionId] || [];
        },
        
        getLatestUpdate(competitionId) {
            const players = this.getPlayersForCompetition(competitionId);
            if (players.length === 0) return null;
            
            return players.reduce((latest, player) => {
                if (!latest) return player.updated_at;
                return new Date(player.updated_at) > new Date(latest) ? player.updated_at : latest;
            }, null);
        },
        
        showAddPlayer(competitionId) {
            this.newPlayer = {
                competition_id: competitionId,
                name: '',
                score: 0
            };
            this.showAddPlayerModal = true;
        },
        
        closeAddPlayerModal() {
            this.showAddPlayerModal = false;
            this.newPlayer = { competition_id: null, name: '', score: 0 };
        },
        
        showEditPlayer(player) {
            this.editingPlayer = {
                id: player.id,
                name: player.name,
                score: player.score,
                competition_id: player.competition_id
            };
            this.showEditPlayerModal = true;
        },
        
        closeEditPlayerModal() {
            this.showEditPlayerModal = false;
            this.editingPlayer = { id: null, name: '', score: 0, competition_id: null };
        },
        
        async updatePlayer() {
            if (!this.editingPlayer.name.trim()) {
                alert('Please enter a player name');
                return;
            }
            
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch(`/api/players/${this.editingPlayer.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${credentials}`
                    },
                    body: JSON.stringify({
                        name: this.editingPlayer.name,
                        score: this.editingPlayer.score
                    })
                });
                
                if (response.ok) {
                    await this.fetchPlayersForCompetition(this.editingPlayer.competition_id);
                    this.lastUpdated = new Date().toLocaleTimeString();
                    this.closeEditPlayerModal();
                    this.saveMessage = 'Player updated successfully!';
                    this.saveSuccess = true;
                    setTimeout(() => { this.saveMessage = ''; }, 3000);
                } else {
                    this.saveMessage = 'Failed to update player. Please try again.';
                    this.saveSuccess = false;
                }
            } catch (error) {
                console.error('Error updating player:', error);
                this.saveMessage = 'Error updating player. Please try again.';
                this.saveSuccess = false;
            }
        },
        
        async addPlayer() {
            if (!this.newPlayer.name.trim()) {
                alert('Please enter a player name');
                return;
            }
            
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch('/api/players', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${credentials}`
                    },
                    body: JSON.stringify(this.newPlayer)
                });
                
                if (response.ok) {
                    await this.fetchPlayersForCompetition(this.newPlayer.competition_id);
                    this.lastUpdated = new Date().toLocaleTimeString();
                    this.closeAddPlayerModal();
                    this.saveMessage = 'Player added successfully!';
                    this.saveSuccess = true;
                    setTimeout(() => { this.saveMessage = ''; }, 3000);
                } else {
                    this.saveMessage = 'Failed to add player. Please try again.';
                    this.saveSuccess = false;
                }
            } catch (error) {
                console.error('Error adding player:', error);
                this.saveMessage = 'Error adding player. Please try again.';
                this.saveSuccess = false;
            }
        },
        
        async removePlayer(playerId) {
            if (!confirm('Are you sure you want to remove this player?')) {
                return;
            }
            
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch(`/api/players/${playerId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });
                
                if (response.ok) {
                    // Find which competition this player belongs to and refresh
                    for (const competitionId in this.allPlayers) {
                        const players = this.allPlayers[competitionId];
                        const playerIndex = players.findIndex(p => p.id === playerId);
                        if (playerIndex !== -1) {
                            await this.fetchPlayersForCompetition(parseInt(competitionId));
                            break;
                        }
                    }
                    
                    this.lastUpdated = new Date().toLocaleTimeString();
                    this.saveMessage = 'Player removed successfully!';
                    this.saveSuccess = true;
                    setTimeout(() => { this.saveMessage = ''; }, 3000);
                } else {
                    this.saveMessage = 'Failed to remove player. Please try again.';
                    this.saveSuccess = false;
                }
            } catch (error) {
                console.error('Error removing player:', error);
                this.saveMessage = 'Error removing player. Please try again.';
                this.saveSuccess = false;
            }
        },
        
        async saveChanges() {
            this.isSaving = true;
            this.saveMessage = '';
            
            try {
                // Collect all players from all competitions
                const allPlayersArray = [];
                for (const competitionId in this.allPlayers) {
                    const players = this.allPlayers[competitionId];
                    allPlayersArray.push(...players);
                }
                
                const credentials = btoa('admin:admin123');
                const response = await fetch('/api/competitions', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${credentials}`
                    },
                    body: JSON.stringify(allPlayersArray)
                });
                
                if (response.ok) {
                    this.lastUpdated = new Date().toLocaleTimeString();
                    this.saveMessage = 'Changes saved successfully!';
                    this.saveSuccess = true;
                    
                    // Update original players for reset functionality
                    for (const competitionId in this.allPlayers) {
                        this.originalPlayers[competitionId] = JSON.parse(JSON.stringify(this.allPlayers[competitionId]));
                    }
                    
                    setTimeout(() => { this.saveMessage = ''; }, 3000);
                } else {
                    this.saveMessage = 'Failed to save changes. Please try again.';
                    this.saveSuccess = false;
                }
            } catch (error) {
                console.error('Error saving changes:', error);
                this.saveMessage = 'Error saving changes. Please try again.';
                this.saveSuccess = false;
            } finally {
                this.isSaving = false;
            }
        },
        
        resetChanges() {
            for (const competitionId in this.originalPlayers) {
                this.allPlayers[competitionId] = JSON.parse(JSON.stringify(this.originalPlayers[competitionId]));
            }
            this.saveMessage = '';
        },
        
        formatTime(timestamp) {
            if (!timestamp) return 'Never';
            
            const date = new Date(timestamp);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            if (diffInSeconds < 60) {
                return `${diffInSeconds}s ago`;
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes}m ago`;
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                return `${hours}h ago`;
            } else {
                return date.toLocaleDateString();
            }
        }
    }
}).mount('#admin-app');
