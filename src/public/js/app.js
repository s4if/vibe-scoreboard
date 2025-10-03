// Wait for Vue to be available
function waitForVue(callback) {
    if (typeof Vue !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForVue(callback), 100);
    }
}

// CompetitionTable Component
const CompetitionTable = {
    name: 'CompetitionTable',
    props: {
        competition: {
            type: Object,
            required: true
        }
    },
    template: `
        <div class="competition-table">
            <div class="table-header">
                <h3>{{ competition.name }}</h3>
            </div>
            <div class="table-content">
                <div class="leaderboard">
                    <div v-if="competition.players && competition.players.length > 0" class="players-list">
                        <div 
                            v-for="(player, index) in topPlayers" 
                            :key="player.id" 
                            :class="['player-row', 'rank-' + (index + 1)]"
                        >
                            <div class="rank">
                                <span class="rank-number">{{ index + 1 }}</span>
                            </div>
                            <div class="player-name">
                                <span class="value">{{ player.name }}</span>
                            </div>
                            <div class="player-score">
                                <span class="score-value">{{ player.score }}</span>
                            </div>
                        </div>
                        <div v-if="competition.players.length > 5" class="more-players">
                            <small>+{{ competition.players.length - 5 }} more</small>
                        </div>
                    </div>
                    <div v-else class="no-players">
                        <p>No players yet</p>
                    </div>
                </div>
                <div class="last-update">
                    <small>Updated: {{ formatTime(getLatestUpdate()) }}</small>
                </div>
            </div>
        </div>
    `,
    computed: {
        topPlayers() {
            return this.competition.players ? this.competition.players.slice(0, 5) : [];
        }
    },
    methods: {
        formatTime(timestamp) {
            if (!timestamp) return 'Never';
            
            const date = new Date(timestamp);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            if (diffInSeconds < 60) {
                return diffInSeconds + 's ago';
            } else if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                return minutes + 'm ago';
            } else if (diffInSeconds < 86400) {
                const hours = Math.floor(diffInSeconds / 3600);
                return hours + 'h ago';
            } else {
                return date.toLocaleDateString();
            }
        },
        
        getLatestUpdate() {
            if (!this.competition.players || this.competition.players.length === 0) {
                return null;
            }
            
            // Find the most recent update timestamp among all players
            const latestTimestamp = this.competition.players.reduce((latest, player) => {
                if (!latest) return player.updated_at;
                return new Date(player.updated_at) > new Date(latest) ? player.updated_at : latest;
            }, null);
            
            return latestTimestamp;
        }
    }
};

waitForVue(() => {
    const { createApp } = Vue;

    // Main App
    const app = createApp({
    data() {
        return {
            competitions: [],
            isConnected: false,
            lastUpdated: 'Never',
            ws: null,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5
        };
    },
    mounted() {
        this.initWebSocket();
        this.fetchInitialData();
    },
    beforeUnmount() {
        this.cleanupWebSocket();
    },
    methods: {
        initWebSocket() {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                };
                
                this.ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    console.log('Received message:', message);
                    
                    if (message.type === 'init' || message.type === 'update') {
                        this.competitions = message.data;
                        this.lastUpdated = new Date().toLocaleTimeString();
                    }
                };
                
                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.isConnected = false;
                    this.attemptReconnect();
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnected = false;
                };
                
            } catch (error) {
                console.error('Failed to initialize WebSocket:', error);
                this.isConnected = false;
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
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                
                setTimeout(() => {
                    this.initWebSocket();
                }, 3000); // Wait 3 seconds before reconnecting
            } else {
                console.error('Max reconnection attempts reached');
            }
        },
        
        async fetchInitialData() {
            try {
                const response = await fetch('/api/competitions');
                if (response.ok) {
                    const data = await response.json();
                    this.competitions = data;
                    this.lastUpdated = new Date().toLocaleTimeString();
                } else {
                    console.error('Failed to fetch initial data');
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        }
    }
    });
    
    // Register the CompetitionTable component globally
    app.component('competition-table', CompetitionTable);
    
    // Mount the app
    app.mount('#app');
});
