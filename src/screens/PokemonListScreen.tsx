import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { PokemonListItem } from '../types/pokemon';
import { pokemonApi } from '../services/pokemonApi';
import { PokemonCard } from '../components/PokemonCard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PokemonList'>;

const ITEMS_PER_PAGE = 20;

export const PokemonListScreen: React.FC<Props> = ({ navigation }) => {
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPokemonList = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const offset = isRefresh ? 0 : pokemonList.length;
      const response = await pokemonApi.getPokemonList(ITEMS_PER_PAGE, offset);

      if (isRefresh) {
        setPokemonList(response.results);
      } else {
        setPokemonList((prev) => [...prev, ...response.results]);
      }

      setNextUrl(response.next);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Pokemon';
      setError(errorMessage);
      console.error('Error loading Pokemon list:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [pokemonList.length]);

  useEffect(() => {
    loadPokemonList();
  }, []);

  const handlePokemonPress = (pokemonId: number) => {
    navigation.navigate('PokemonDetail', { pokemonId });
  };

  const handleLoadMore = () => {
    if (nextUrl && !isLoading) {
      loadPokemonList();
    }
  };

  const handleRefresh = () => {
    loadPokemonList(true);
  };

  if (isLoading && pokemonList.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading Pokemon...</Text>
      </View>
    );
  }

  if (error && pokemonList.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadPokemonList(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pokemonList}
        renderItem={({ item }) => (
          <PokemonCard pokemon={item} onPress={handlePokemonPress} />
        )}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={
          isLoading && pokemonList.length > 0 ? (
            <ActivityIndicator size="small" color="#FF6B6B" style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerLoader: {
    marginVertical: 20,
  },
});

