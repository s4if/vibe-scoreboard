const { createApp } = Vue;

createApp({
    data() {
        return {
            isLoggedIn: false,
            isLoading: false,
            loginError: '',
            message: '',
            messageType: '',
            loginForm: {
                username: '',
                password: ''
            },
            players: [],
            competitions: [],
            competitionPlayers: {},
            searchQuery: '',
            showCreateModal: false,
            showEditModal: false,
            showDeleteModal: false,
            creatingPlayer: {
                name: ''
            },
            editingPlayer: {
                id: null,
                name: ''
            },
            deletingPlayer: {
                id: null,
                name: ''
            }
        };
    },
    computed: {
        totalPlayers() {
            return this.players.length;
        },
        activeCompetitions() {
            return this.competitions.length;
        },
        averagePlayersPerCompetition() {
            if (this.competitions.length === 0) return 0;
            const totalPlayersInCompetitions = Object.values(this.competitionPlayers)
                .reduce((sum, players) => sum + players.length, 0);
            return (totalPlayersInCompetitions / this.competitions.length).toFixed(1);
        },
        filteredPlayers() {
            if (!this.searchQuery) return this.players;
            
            const query = this.searchQuery.toLowerCase();
            return this.players.filter(player => 
                player.name.toLowerCase().includes(query)
            );
        }
    },
    mounted() {
        this.checkAuth();
    },
    methods: {
        async login() {
            this.isLoading = true;
            this.loginError = '';
            
            try {
                const credentials = btoa(`${this.loginForm.username}:${this.loginForm.password}`);
                const response = await fetch('/api/players/all', {
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });
                
                if (response.ok) {
                    this.isLoggedIn = true;
                    this.loginForm = { username: '', password: '' };
                    await this.fetchData();
                    localStorage.setItem('isAdminLoggedIn', 'true');
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
            this.isLoggedIn = false;
            this.players = [];
            this.competitions = [];
            this.competitionPlayers = {};
            this.searchQuery = '';
            this.message = '';
            this.loginError = '';
            localStorage.removeItem('isAdminLoggedIn');
        },
        
        checkAuth() {
            const isAuthenticated = localStorage.getItem('isAdminLoggedIn');
            if (isAuthenticated === 'true') {
                this.isLoggedIn = true;
                this.fetchData();
            }
        },
        
        async fetchData() {
            await Promise.all([
                this.fetchPlayers(),
                this.fetchCompetitions()
            ]);
        },
        
        async fetchPlayers() {
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch('/api/players/all', {
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });
                
                if (response.ok) {
                    this.players = await response.json();
                }
            } catch (error) {
                console.error('Error fetching players:', error);
                this.showMessage('Error fetching players', 'error');
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
                    this.competitions = await response.json();
                    
                    // Fetch players for each competition
                    for (const competition of this.competitions) {
                        await this.fetchCompetitionPlayers(competition.id);
                    }
                }
            } catch (error) {
                console.error('Error fetching competitions:', error);
            }
        },
        
        async fetchCompetitionPlayers(competitionId) {
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch(`/api/players?competition_id=${competitionId}`, {
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });
                
                if (response.ok) {
                    this.competitionPlayers[competitionId] = await response.json();
                }
            } catch (error) {
                console.error('Error fetching competition players:', error);
            }
        },
        
        getPlayerCompetitionCount(playerId) {
            let count = 0;
            for (const competitionId in this.competitionPlayers) {
                const players = this.competitionPlayers[competitionId];
                if (players.some(p => p.id === playerId)) {
                    count++;
                }
            }
            return count;
        },
        
        filterPlayers() {
            // This is handled by the computed property
        },
        
        showCreatePlayer() {
            this.creatingPlayer = { name: '' };
            this.showCreateModal = true;
            this.$nextTick(() => {
                this.$refs.createPlayerInput?.focus();
            });
        },
        
        closeCreateModal() {
            this.showCreateModal = false;
            this.creatingPlayer = { name: '' };
        },
        
        showEditPlayer(player) {
            this.editingPlayer = {
                id: player.id,
                name: player.name
            };
            this.showEditModal = true;
        },
        
        closeEditModal() {
            this.showEditModal = false;
            this.editingPlayer = { id: null, name: '' };
        },
        
        confirmDeletePlayer(player) {
            this.deletingPlayer = {
                id: player.id,
                name: player.name
            };
            this.showDeleteModal = true;
        },
        
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.deletingPlayer = { id: null, name: '' };
        },
        
        async createPlayer() {
            if (!this.creatingPlayer.name.trim()) {
                this.showMessage('Please enter a player name', 'error');
                return;
            }
            
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch('/api/players/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${credentials}`
                    },
                    body: JSON.stringify({
                        name: this.creatingPlayer.name.trim()
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    this.players.push(data);
                    this.closeCreateModal();
                    this.showMessage('Player created successfully!', 'success');
                } else {
                    this.showMessage(data.error || 'Failed to create player', 'error');
                }
            } catch (error) {
                console.error('Error creating player:', error);
                this.showMessage('Error creating player', 'error');
            }
        },
        
        async updatePlayer() {
            if (!this.editingPlayer.name.trim()) {
                this.showMessage('Please enter a player name', 'error');
                return;
            }
            
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch(`/api/players/${this.editingPlayer.id}/update`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${credentials}`
                    },
                    body: JSON.stringify({
                        name: this.editingPlayer.name.trim()
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    const index = this.players.findIndex(p => p.id === this.editingPlayer.id);
                    if (index !== -1) {
                        this.players[index] = data;
                    }
                    this.closeEditModal();
                    this.showMessage('Player updated successfully!', 'success');
                } else {
                    this.showMessage(data.error || 'Failed to update player', 'error');
                }
            } catch (error) {
                console.error('Error updating player:', error);
                this.showMessage('Error updating player', 'error');
            }
        },
        
        async deletePlayer() {
            try {
                const credentials = btoa('admin:admin123');
                const response = await fetch(`/api/players/${this.deletingPlayer.id}/delete`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Basic ${credentials}`
                    }
                });
                
                if (response.ok) {
                    this.players = this.players.filter(p => p.id !== this.deletingPlayer.id);
                    this.closeDeleteModal();
                    this.showMessage('Player deleted successfully!', 'success');
                } else {
                    this.showMessage('Failed to delete player', 'error');
                }
            } catch (error) {
                console.error('Error deleting player:', error);
                this.showMessage('Error deleting player', 'error');
            }
        },
        
        showMessage(text, type = 'success') {
            this.message = text;
            this.messageType = type;
            setTimeout(() => {
                this.message = '';
            }, 3000);
        },
        
        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            return new Date(timestamp).toLocaleDateString();
        }
    }
}).mount('#players-app');