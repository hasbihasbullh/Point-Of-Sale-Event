package com.csm.pos.kasir.data.remote

import com.csm.pos.kasir.data.remote.dto.ApiOrderDto
import com.csm.pos.kasir.data.remote.dto.MasterDataResponse
import com.csm.pos.kasir.data.remote.dto.SyncBatchRequest
import com.csm.pos.kasir.data.remote.dto.SyncBatchResponse
import com.csm.pos.kasir.data.remote.dto.VoidOrderRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @GET("/api/data")
    suspend fun getMasterData(): Response<MasterDataResponse>

    @POST("/api/orders/sync-batch")
    suspend fun syncBatchOrders(
        @Body request: SyncBatchRequest
    ): Response<SyncBatchResponse>

    @GET("/api/booths/{booth_id}/orders")
    suspend fun getBoothOrders(
        @Path("booth_id") boothId: String,
        @Query("date") date: String? = null
    ): Response<List<ApiOrderDto>>

    @PUT("/api/orders/{id}/void")
    suspend fun voidOrder(
        @Path("id") orderId: String,
        @Body request: VoidOrderRequest = VoidOrderRequest()
    ): Response<ApiOrderDto>
}
