<template>
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
                        :class="['player-row', `rank-${index + 1}`]"
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
</template>

<script>
export default {
    name: 'CompetitionTable',
    props: {
        competition: {
            type: Object,
            required: true
        }
    },
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
}
</script>

<style scoped>
.competition-table {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 20px;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    min-height: 320px;
}

.competition-table:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.table-header {
    text-align: center;
    margin-bottom: 20px;
}

.table-header h3 {
    margin: 0;
    font-size: 1.4em;
    font-weight: 700;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.table-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.leaderboard {
    flex: 1;
}

.players-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.player-row {
    display: flex;
    align-items: center;
    padding: 4px 6px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 1px;
}

.player-row:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(5px);
}

.rank {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    margin-right: 12px;
}

.rank-number {
    font-weight: 800;
    font-size: 1.2em;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.player-name {
    flex: 1;
    display: flex;
    align-items: center;
}

.player-name .value {
    font-size: 1.1em;
    font-weight: 600;
    word-break: break-word;
}

.player-score {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 60px;
}

.score-value {
    font-size: 1.4em;
    font-weight: 800;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* Rank-specific styling */
.rank-1 .rank-number {
    color: #ffd700;
    font-size: 1.3em;
}

.rank-2 .rank-number {
    color: #c0c0c0;
    font-size: 1.2em;
}

.rank-3 .rank-number {
    color: #cd7f32;
    font-size: 1.1em;
}

.rank-1 {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1));
    border: 1px solid rgba(255, 215, 0, 0.3);
}

.rank-2 {
    background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1));
    border: 1px solid rgba(192, 192, 192, 0.3);
}

.rank-3 {
    background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1));
    border: 1px solid rgba(205, 127, 50, 0.3);
}

.no-players {
    text-align: center;
    padding: 40px 20px;
    opacity: 0.7;
    font-style: italic;
}

.last-update {
    text-align: center;
    opacity: 0.7;
    font-size: 0.8em;
    margin-top: auto;
}

@media (max-width: 768px) {
    .competition-table {
        padding: 15px;
        margin: 10px 5px;
        min-height: 280px;
    }
    
    .table-header h3 {
        font-size: 1.2em;
    }
    
    .player-row {
        padding: 6px 8px;
        gap: 8px;
    }
    
    .rank {
        min-width: 25px;
        margin-right: 8px;
    }
    
    .rank-number {
        font-size: 1em;
    }
    
    .player-name .value {
        font-size: 0.9em;
    }
    
    .score-value {
        font-size: 1.1em;
    }
    
    .rank-1 .rank-number {
        font-size: 1.1em;
    }
    
    .rank-2 .rank-number {
        font-size: 1.05em;
    }
    
    .rank-3 .rank-number {
        font-size: 1em;
    }
}
</style>
