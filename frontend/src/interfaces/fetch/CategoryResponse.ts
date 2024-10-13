export interface CategoriesData {
    category_id: number,
    category_name: string
}

export interface CategoriesResponse {
    status: number;
    success: boolean;
    data: CategoriesData[];
}
