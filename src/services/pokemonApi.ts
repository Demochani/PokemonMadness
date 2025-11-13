import { Pokemon, PokemonListResponse } from '../types/pokemon';

const BASE_URL = 'https://pokeapi.co/api/v2';

class PokemonApiService {
  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getPokemonList(limit: number = 20, offset: number = 0): Promise<PokemonListResponse> {
    const url = `${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`;
    return this.fetchJson<PokemonListResponse>(url);
  }

  async getPokemonById(id: number): Promise<Pokemon> {
    const url = `${BASE_URL}/pokemon/${id}`;
    return this.fetchJson<Pokemon>(url);
  }

  async getPokemonByName(name: string): Promise<Pokemon> {
    const url = `${BASE_URL}/pokemon/${name.toLowerCase()}`;
    return this.fetchJson<Pokemon>(url);
  }

  extractPokemonIdFromUrl(url: string): number {
    const matches = url.match(/\/pokemon\/(\d+)\//);
    return matches ? parseInt(matches[1], 10) : 0;
  }
}

export const pokemonApi = new PokemonApiService();

