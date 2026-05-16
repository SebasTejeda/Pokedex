export interface Pokemon {
    id: number;
    name: string;
    height: number;
    weight: number;
    sprites: {
        front_default: string;
        other?: {
            'official-artwork'?: {
                front_default: string;
            }
        }
    };
    types: Array<{
        type: {
            name: string;
        }
    }>;
    stats: Array<{
        base_stat: number;
        stat: {
            name: string;
        }
    }>;
}

export interface PokemonListItem {
    name: string;
    url: string;
}

export interface PokemonListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PokemonListItem[];
}
