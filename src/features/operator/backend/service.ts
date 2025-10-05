import type { SupabaseClient } from '@supabase/supabase-js';
import type { Result } from '@/backend/http/result';
import { failure, success } from '@/backend/http/result';
import { operatorErrorCodes } from './error';
import type {
  CreateReportRequest,
  ReportListResponse,
  UpdateReportRequest,
  ReportItem,
  CategoryItem,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DifficultyItem,
  CreateDifficultyRequest,
  UpdateDifficultyRequest,
  ReportStatus,
} from './schema';

// ========================================
// Report Functions
// ========================================

/**
 * Create Report
 */
export async function createReport(
  client: SupabaseClient,
  userId: string,
  request: CreateReportRequest,
): Promise<Result<{ id: string }, string>> {
  try {
    // Get reporter name
    const { data: profile } = await client
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    if (!profile) {
      return failure(operatorErrorCodes.unauthorized, '사용자 정보를 찾을 수 없습니다');
    }

    // Insert report
    const { data: report, error: reportError } = await client
      .from('reports')
      .insert({
        reporter_id: userId,
        target_type: request.targetType,
        target_id: request.targetId,
        reason: request.reason,
        content: request.content,
        status: 'received',
      })
      .select('id')
      .single();

    if (reportError || !report) {
      return failure(operatorErrorCodes.databaseError, '신고 접수에 실패했습니다');
    }

    return success({ id: report.id });
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

/**
 * Get Reports (Operator)
 */
export async function getReports(
  client: SupabaseClient,
  status?: ReportStatus,
): Promise<Result<ReportListResponse, string>> {
  try {
    let query = client
      .from('reports')
      .select(
        `
        id,
        reporter_id,
        target_type,
        target_id,
        reason,
        content,
        status,
        action_taken,
        created_at,
        updated_at,
        profiles!inner(name)
      `,
      )
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      return failure(operatorErrorCodes.databaseError, '신고 목록 조회에 실패했습니다');
    }

    const reportList: ReportItem[] = reports.map((r: any) => ({
      id: r.id,
      reporterId: r.reporter_id,
      reporterName: r.profiles.name,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      content: r.content,
      status: r.status,
      actionTaken: r.action_taken,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return success({
      reports: reportList,
      total: reports.length,
    });
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

/**
 * Update Report (Operator)
 */
export async function updateReport(
  client: SupabaseClient,
  reportId: string,
  request: UpdateReportRequest,
): Promise<Result<void, string>> {
  try {
    // Check if report exists
    const { data: report } = await client
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .single();

    if (!report) {
      return failure(operatorErrorCodes.reportNotFound, '신고를 찾을 수 없습니다');
    }

    // Update report
    const updateData: Record<string, any> = {
      status: request.status,
      updated_at: new Date().toISOString(),
    };

    if (request.actionTaken !== undefined) {
      updateData.action_taken = request.actionTaken;
    }

    const { error: updateError } = await client
      .from('reports')
      .update(updateData)
      .eq('id', reportId);

    if (updateError) {
      return failure(operatorErrorCodes.databaseError, '신고 업데이트에 실패했습니다');
    }

    return success(undefined);
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

// ========================================
// Category Functions
// ========================================

/**
 * Get All Categories (Operator)
 */
export async function getCategories(
  client: SupabaseClient,
): Promise<Result<CategoryItem[], string>> {
  try {
    const { data: categories, error: categoriesError } = await client
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (categoriesError) {
      return failure(operatorErrorCodes.databaseError, '카테고리 조회에 실패했습니다');
    }

    const categoryList: CategoryItem[] = categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      isActive: c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return success(categoryList);
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

/**
 * Create Category (Operator)
 */
export async function createCategory(
  client: SupabaseClient,
  request: CreateCategoryRequest,
): Promise<Result<{ id: string }, string>> {
  try {
    const { data: category, error: categoryError } = await client
      .from('categories')
      .insert({
        name: request.name,
        is_active: true,
      })
      .select('id')
      .single();

    if (categoryError || !category) {
      return failure(operatorErrorCodes.databaseError, '카테고리 생성에 실패했습니다');
    }

    return success({ id: category.id });
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

/**
 * Update Category (Operator)
 */
export async function updateCategory(
  client: SupabaseClient,
  categoryId: string,
  request: UpdateCategoryRequest,
): Promise<Result<void, string>> {
  try {
    // Check if category exists
    const { data: category } = await client
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (!category) {
      return failure(operatorErrorCodes.categoryNotFound, '카테고리를 찾을 수 없습니다');
    }

    // Check if category is in use when deactivating
    if (request.isActive === false) {
      const { count } = await client
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (count && count > 0) {
        return failure(
          operatorErrorCodes.categoryInUse,
          `이 카테고리는 ${count}개의 코스에서 사용 중입니다`,
        );
      }
    }

    // Update category
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (request.name !== undefined) updateData.name = request.name;
    if (request.isActive !== undefined) updateData.is_active = request.isActive;

    const { error: updateError } = await client
      .from('categories')
      .update(updateData)
      .eq('id', categoryId);

    if (updateError) {
      return failure(operatorErrorCodes.databaseError, '카테고리 업데이트에 실패했습니다');
    }

    return success(undefined);
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

// ========================================
// Difficulty Functions
// ========================================

/**
 * Get All Difficulties (Operator)
 */
export async function getDifficulties(
  client: SupabaseClient,
): Promise<Result<DifficultyItem[], string>> {
  try {
    const { data: difficulties, error: difficultiesError } = await client
      .from('difficulties')
      .select('*')
      .order('level', { ascending: true });

    if (difficultiesError) {
      return failure(operatorErrorCodes.databaseError, '난이도 조회에 실패했습니다');
    }

    const difficultyList: DifficultyItem[] = difficulties.map((d: any) => ({
      id: d.id,
      name: d.name,
      level: d.level,
      isActive: d.is_active,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    return success(difficultyList);
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

/**
 * Create Difficulty (Operator)
 */
export async function createDifficulty(
  client: SupabaseClient,
  request: CreateDifficultyRequest,
): Promise<Result<{ id: string }, string>> {
  try {
    const { data: difficulty, error: difficultyError } = await client
      .from('difficulties')
      .insert({
        name: request.name,
        level: request.level,
        is_active: true,
      })
      .select('id')
      .single();

    if (difficultyError || !difficulty) {
      return failure(operatorErrorCodes.databaseError, '난이도 생성에 실패했습니다');
    }

    return success({ id: difficulty.id });
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

/**
 * Update Difficulty (Operator)
 */
export async function updateDifficulty(
  client: SupabaseClient,
  difficultyId: string,
  request: UpdateDifficultyRequest,
): Promise<Result<void, string>> {
  try {
    // Check if difficulty exists
    const { data: difficulty } = await client
      .from('difficulties')
      .select('id')
      .eq('id', difficultyId)
      .single();

    if (!difficulty) {
      return failure(operatorErrorCodes.difficultyNotFound, '난이도를 찾을 수 없습니다');
    }

    // Check if difficulty is in use when deactivating
    if (request.isActive === false) {
      const { count } = await client
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('difficulty_id', difficultyId);

      if (count && count > 0) {
        return failure(
          operatorErrorCodes.difficultyInUse,
          `이 난이도는 ${count}개의 코스에서 사용 중입니다`,
        );
      }
    }

    // Update difficulty
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (request.name !== undefined) updateData.name = request.name;
    if (request.level !== undefined) updateData.level = request.level;
    if (request.isActive !== undefined) updateData.is_active = request.isActive;

    const { error: updateError } = await client
      .from('difficulties')
      .update(updateData)
      .eq('id', difficultyId);

    if (updateError) {
      return failure(operatorErrorCodes.databaseError, '난이도 업데이트에 실패했습니다');
    }

    return success(undefined);
  } catch (error) {
    return failure(
      operatorErrorCodes.databaseError,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}
