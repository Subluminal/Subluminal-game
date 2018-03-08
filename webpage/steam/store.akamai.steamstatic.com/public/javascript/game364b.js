"use strict";


function ShowEmbedWidget( )
{
	$J('#widget_create').show();
	$J('#widget_finished').hide();

	var $Content = $J('#EmbedModal');
	$Content.detach();
	$Content.show();

	var deferred = new jQuery.Deferred();
	var fnOK = function() { deferred.resolve(); };

	var Modal = _BuildDialog( "\u5efa\u7acb\u8981\u5d4c\u5165\u7684 Widget", $Content, [], fnOK, {} );
	deferred.always( function() { Modal.Dismiss(); } );
	Modal.Show();

	// attach the deferred's events to the modal
	deferred.promise( Modal );

	Modal.always(
		function() {
			// save it away again for later
			$Content.hide();
			$J(document.body).append( $Content );
		}
	);
}

function ShowShareDialog( )
{
	var $Content = $J('#ShareModal');
	$Content.detach();
	$Content.show();

	ShowAlertDialog( "\u5206\u4eab", $Content).always(
		function() {
			// save it away again for later
			$Content.hide();
			$J(document.body).append( $Content );
		}
	);

}

function CreateWidget( nAppId )
{
	$J('#widget_create').hide();

	var nSubId = $J('input[name=w_subid]').val();
	if( !nSubId )
		nSubId = $J('input:radio[name=w_rsubid]:checked').val();

	var strDesc = $J('textarea[name=w_text]').val();

	var strWidgetURL;
	if( nSubId )
		strWidgetURL = 'http://store.steampowered.com/widget/' + nAppId + '/' + nSubId + '/';
	else
		strWidgetURL = 'http://store.steampowered.com/widget/' + nAppId + '/';

	if( strDesc )
		strWidgetURL = strWidgetURL + '?t=' + encodeURIComponent( strDesc );

	var strWidgetCode = '<iframe src="' + strWidgetURL + '" frameborder="0" width="646" height="190"></iframe>';

	var $iframe = $J(strWidgetCode);

	$J('#widget_container').empty();
	$J('#widget_container').append($iframe);
	$J('#widget_code').val( strWidgetCode );

	$J('#widget_finished').show();
}

function InitQueueControls( store_appid, steamworks_appid, next_in_queue_appid, snr )
{
	var $FollowBtn = $J('.queue_control_button.queue_btn_follow .queue_btn_inactive');
	var $UnFollowBtn = $J('.queue_control_button.queue_btn_follow .queue_btn_active');
	var $IgnoreBtn = $J('.queue_control_button.queue_btn_ignore .queue_btn_inactive');
	var $UnIgnoreBtn = $J('.queue_control_button.queue_btn_ignore .queue_btn_active');

	$IgnoreBtn.click( function() {
		$J.post( 'http://store.steampowered.com/recommended/ignorerecommendation/', {
			sessionid: g_sessionID,
			appid: store_appid,
			snr: snr
		}).done( function( data ) {
			$IgnoreBtn.hide();
			$UnIgnoreBtn.show();
			GDynamicStore.InvalidateCache();
			if ( data && data.nSaleTaskCompleted ) { NewStickerPackModal( '將項目標為「不感興趣」' ); } // SummerSale2017
		}).fail( function( jqXHR ) {
			ShowAlertDialog( '不感興趣', '在儲存您的變更時發生問題。請稍後再試。' );
		});
	});

	$UnIgnoreBtn.click( function() {
		$J.post( 'http://store.steampowered.com/recommended/ignorerecommendation/', {
			sessionid: g_sessionID,
			appid: store_appid,
			snr: snr,
			remove: 1
		}).done( function() {
			$IgnoreBtn.show();
			$UnIgnoreBtn.hide();
			GDynamicStore.InvalidateCache();
		}).fail( function() {
			ShowAlertDialog( '不感興趣', '在儲存您的變更時發生問題。請稍後再試。' );
		});
	});

	$FollowBtn.click( function() {
		$J.post( 'http://store.steampowered.com/explore/followgame/', {
			sessionid: g_sessionID,
			appid: steamworks_appid
		}).done( function() {
			$FollowBtn.hide();
			$UnFollowBtn.show();
		}).fail( function() {
			ShowAlertDialog( '關注', '在儲存您的變更時發生問題。請稍後再試。' );
		});
	});

	$UnFollowBtn.click( function() {
		$J.post( 'http://store.steampowered.com/explore/followgame/', {
			sessionid: g_sessionID,
			appid: steamworks_appid,
			unfollow: 1
		}).done( function() {
			$FollowBtn.show();
			$UnFollowBtn.hide();
		}).fail( function() {
			ShowAlertDialog( '關注', '在儲存您的變更時發生問題。請稍後再試。' );
		});
	});

	// discovery queue settings dialog
	var bQueueIsValid = true;
	var $NextInQueueBtn = $J('.btn_next_in_queue_trigger');

	$NextInQueueBtn.click( function() {
		if ( bQueueIsValid )
			$J('#next_in_queue_form').submit();
		else
			window.location = 'http://store.steampowered.com/explore/startnew';
	});

	$J('a.dq_settings_link').click( function() {
		CDiscoveryQueue.ShowCustomizeDialog( function( data ) {
			if ( data && data.queue && ( data.queue.indexOf( store_appid ) == -1 ||
				( next_in_queue_appid && data.queue.indexOf( next_in_queue_appid ) == -1 ) ) )
			{
				ShowConfirmDialog( '自訂您的探索佇列', '我們已經根據您的自定義設定打造了新的探索佇列。您想要怎麼做呢？',
					'開始探索新的佇列','留在本頁'
				).done( function() {
					window.location = 'http://store.steampowered.com/explore/startnew/' + g_eDiscoveryQueueType + '/';
				});
				bQueueIsValid = false;
			}
			else
			{
				bQueueIsValid = true;
			}
		}, g_eDiscoveryQueueType );
	} );
}


function InitAutocollapse()
{
	$J('.game_page_autocollapse').each( function() {
		var content = this;
		var $Content = $J(content);
		$Content.wrap( $J('<div/>', {'class': 'game_page_autocollapse_ctn' } ) );

		var $Container = $Content.parent();

		var $ReadMore = $J('<div/>', {'class': 'game_page_autocollapse_readmore' }).text( '繼續閱讀' );
		var $Fade = $J('<div/>', {'class': 'game_page_autocollapse_fade' } ).append( $ReadMore );
		$Container.append( $Fade );

		var nInterval = 0;
		var nMaxHeight = parseInt( $Content.css('max-height') );
		var bMaxHeightSet = true;

		$Content.on( 'gamepage_autocollapse_expand', function() {
			if ( $Container.hasClass( 'collapsed' ) )
			{
				$Container.removeClass( 'collapsed' );
				$Container.addClass( 'expanded' );

				if ( bMaxHeightSet )
				{
					$Content.animate( {'max-height': content.scrollHeight + 20 + 'px'}, 'fast', null, function() { $Content.css('max-height', 'none' ); } );
				}
				window.clearInterval( nInterval );
			}
		});

		$ReadMore.click( function() { $Content.trigger('gamepage_autocollapse_expand'); } );

		var fnCheckHeight = function ()	{
			if ( content.scrollHeight > nMaxHeight + 30 )
			{
				$Content.css( 'max-height', nMaxHeight + 'px' );
				$Container.addClass( 'collapsed' );
				window.clearInterval( nInterval );
				bMaxHeightSet = true;
			}
			else if ( bMaxHeightSet )
			{
				$Content.css( 'max-height', 'none' );
				bMaxHeightSet = false;
			}
		};

		nInterval = window.setInterval( fnCheckHeight, 250 );
		fnCheckHeight();

	});
}

function RenderMoreLikeThisBlock( rgRecommendedAppIDs )
{
	if ( !rgRecommendedAppIDs || !rgRecommendedAppIDs.length > 0 || !$J('#recommended_block_content').length )
	{
		$J('#recommended_block').hide();
		return;
	}

	var rgRecommendationsToShow = [];
	var nCurScore = 0;
	for ( var i = 0; i < rgRecommendedAppIDs.length; i++ )
	{
		var unAppID = rgRecommendedAppIDs[i];
		if ( GDynamicStore.BIsAppIgnored( unAppID ) )
			continue;
		else if ( GDynamicStore.BIsAppOwned( unAppID ) )
			rgRecommendationsToShow.push( { score: 3 + nCurScore++, appid: unAppID } );
		else
			rgRecommendationsToShow.push( { score: nCurScore++, appid: unAppID } );
	}

	rgRecommendationsToShow.sort( function( a, b ) { return a.score - b.score; } );

	for ( var i = 0; i < rgRecommendationsToShow.length; i++ )
	{
		var unAppID = rgRecommendationsToShow[i].appid;
		var rgItemData = GStoreItemData.rgAppData[ unAppID ];
		if ( !rgItemData )
			continue;

		var params = {'class': 'small_cap',
				'data-ds-appid': unAppID,
				'href': GStoreItemData.GetAppURL( unAppID, 'recommended' )
		};

		var $CapCtn = $J('<a/>', params );
		GStoreItemData.BindHoverEvents( $CapCtn, unAppID, null );

		$CapCtn.append( $J('<img/>', {src: rgItemData.small_capsulev5, 'class': 'small_cap_img' } ) );
		$CapCtn.append( $J('<h4/>').html( rgItemData.name ) );
		$CapCtn.append( $J(rgItemData.discount_block).addClass( 'discount_block_inline') );

		$J('#recommended_block_content').append( $CapCtn );
	}
	GDynamicStore.DecorateDynamicItems( $J('#recommended_block_content') );
	$J('#recommended_block_content').append( $J('<div/>', { style: 'clear: left;' } ) );
	$J('#recommended_block_content').trigger('v_contentschanged');
}

function ShowEULA( elLink )
{
	var win = window.open( elLink.href,'eula','height=584,width=475,resize=yes,scrollbars=yes');
	win.focus();
}


// formerly user_reviews_store.js

var g_recommendationContents = [ 'friend', 'summary', 'recent_short', 'all', 'positive', 'negative', 'recent', 'funny' ];


function OnRecommendationVotedUp( recommendationid )
{
	for ( var i = 0; i < g_recommendationContents.length; ++i )
	{
		$J( '#RecommendationVoteUpBtn' + g_recommendationContents[i] + recommendationid ).addClass( 'btn_active' );
		$J( '#RecommendationVoteDownBtn' + g_recommendationContents[i] + recommendationid ).removeClass( "btn_active" );
		$J( '#RecommendationVoteTagBtn' + g_recommendationContents[i] + recommendationid + '_' + 1 ).removeClass( 'btn_active' );
	}
}

function OnRecommendationVotedDown( recommendationid )
{
	for ( var i = 0; i < g_recommendationContents.length; ++i )
	{
		$J( '#RecommendationVoteUpBtn' + g_recommendationContents[i] + recommendationid ).removeClass( 'btn_active' );
		$J( '#RecommendationVoteDownBtn' + g_recommendationContents[i] + recommendationid ).addClass( "btn_active" );
		$J( '#RecommendationVoteTagBtn' + g_recommendationContents[i] + recommendationid + '_' + 1 ).removeClass( 'btn_active' );
	}
}

function OnRecommendationVotedTag( recommendationid, tagID, bRateUp )
{
	for ( var i = 0; i < g_recommendationContents.length; ++i )
	{
		if ( bRateUp )
		{
			$J( '#RecommendationVoteTagBtn' + g_recommendationContents[i] + recommendationid + '_' + tagID ).addClass( 'btn_active' );
			$J( '#RecommendationVoteUpBtn' + g_recommendationContents[i] + recommendationid ).removeClass( 'btn_active' );
			$J( '#RecommendationVoteDownBtn' + g_recommendationContents[i] + recommendationid ).removeClass( "btn_active" );
		}
		else
		{
			$J( '#RecommendationVoteTagBtn' + g_recommendationContents[i] + recommendationid + '_' + tagID ).removeClass( 'btn_active' );
		}
	}
}

function RequestCurrentUserRecommendationVotes( recommendationIDs )
{
	if ( recommendationIDs.length == 0 )
	{
		return;
	}

	$J.post( 'http://store.steampowered.com//userreviews/ajaxgetvotes/', {
			'recommendationids' : recommendationIDs
		}
	).done( function( response ) {
			if ( response.success == 1 )
			{
				var votes = response.votes;
				for ( var i = 0; i < votes.length; ++i )
				{
					var vote = votes[i];
					if ( vote.voted_up )
					{
						OnRecommendationVotedUp( vote.recommendationid );
					}
					else if ( vote.voted_down )
					{
						OnRecommendationVotedDown( vote.recommendationid );
					}
					if ( vote.voted_funny )
					{
						OnRecommendationVotedTag( vote.recommendationid, 1, true );
					}
				}
			}
		} );
}

function UserReviewVoteUp( id )
{
	UserReview_Rate( id, true, 'http://store.steampowered.com/',
		function( rgResults ) {
			if ( rgResults.nSaleTaskCompleted ) { NewStickerPackModal( '將評論標記為有所助益，或是沒幫上忙');}
			OnRecommendationVotedUp( id );
		}
	);
}

function UserReviewVoteDown( id )
{
	UserReview_Rate( id, false, 'http://store.steampowered.com/',
		function( rgResults ) {
			if ( rgResults.nSaleTaskCompleted ) { NewStickerPackModal( '將評論標記為有所助益，或是沒幫上忙');}
			OnRecommendationVotedDown( id );
		}
	);
}

function UserReviewVoteTag( id, tagID, elemID )
{
	var elem = $J( '#' + elemID );
	var bRateUp = !elem.hasClass( 'btn_active' );
	UserReview_VoteTag( id, tagID, bRateUp, 'http://store.steampowered.com/',
		function( rgResults ) {
			OnRecommendationVotedTag( id, tagID, bRateUp );
		}
	);
}

function UserReviewSetQuality( id )
{
	var quality = $J( "#ReviewQuality" + id ).val();
	UserReview_Moderate_SetQuality( id, quality, 'http://store.steampowered.com/',
		function( rgResults ) {
		}
	);
}

function UserReviewShowMore( id, context )
{
	$J('#ReviewContent'+context+id).parent().removeClass('partial');
	$J('#ReviewContent'+context+id).parent().addClass('expanded');
}

function LoadMoreReviews( appid, startOffset, dayRange, startDate, endDate, context )
{
	$J( "#ViewAllReviews" + context ).remove();
	$J( "#LoadMoreReviews" + context ).remove();
	$J( "#LoadingMoreReviews" + context ).show();

	var container = $J( "#Reviews_" + context );

	var reviewType = $J('input[name="review_type"]:checked').val();
	var purchaseType = $J('input[name="purchase_type"]:checked').val();
	var language = $J('input[name="review_language"]:checked').val();
	var reviewBetaEnabled = $J( "#ReviewBetaCheckbox" ).is( ":checked" ) ? 1 : 0;
	var dateRangeType = $J('input[name="review_date_range"]:checked').val();
	var summaryNumPositiveReviews = $J( "#review_summary_num_positive_reviews" ).val();
	var summaryNumReviews = $J( "#review_summary_num_reviews" ).val();

	var filteredReviewScore = $J( "#user_reviews_filter_score" );
	filteredReviewScore.removeClass( "visible" );

	$J.get( 'http://store.steampowered.com/appreviews/' + appid,{
		'start_offset' : startOffset,
		'day_range' : dayRange,
		'start_date' : startDate,
		'end_date' : endDate,
		'date_range_type' : dateRangeType,
		'filter' : context,
		'language' : language,
		'l' : 'tchinese',
		'review_type' : reviewType,
		'purchase_type' : purchaseType,
		'review_beta_enabled' : reviewBetaEnabled,
		'summary_num_positive_reviews' : summaryNumPositiveReviews,
		'summary_num_reviews' : summaryNumReviews
	}).done( function( data ) {

		RecordAJAXPageView( this.url );

		if ( data.success == 1 )
		{
			$J( "#Reviews_loading" ).hide();
			$J( "#Reviews_" + context ).show();

			if ( startOffset == 0 )
			{
				var filteredReviewScore = $J( "#user_reviews_filter_score" );
				if ( data.review_score )
				{
					filteredReviewScore.addClass( "visible" );
					filteredReviewScore.html( data.review_score );
					BindStoreTooltip( $J('#user_reviews_filter_score [data-store-tooltip]' ) );
				}
				else
				{
					filteredReviewScore.removeClass( "visible" );
				}
			}
			$J( "#LoadingMoreReviews" + context ).remove();

			// remove duplicates
			var recommendationIDs = [];
			var temp = $J('<div></div>');
			temp.append( data.html );
			for ( var i = 0; i < data.recommendationids.length; ++i )
			{
				var recommendationid = data.recommendationids[i];
				var elemID = "#ReviewContent" + context + recommendationid;
				if ( $J( elemID ).length != 0 )
				{
					temp.find( elemID ).parent().remove();
				}
				else
				{
					recommendationIDs.push( recommendationid );
				}
			}

			container.append( temp.children() );

			if ( data.date_filter_text )
			{
				var dateFilterText = $J( "#review_selected_histogram_date_range_text" );
				dateFilterText.text( data.date_filter_text );
				dateFilterText.show();
			}

			// all dupes, request more
			if ( data.recommendationids.length != 0 && recommendationIDs.length == 0 )
			{
				LoadMoreReviews(appid, startOffset + data.recommendationids.length, data.dayrange, data.start_date, data.end_date, context );
			}
			else
			{
				CollapseLongReviews();
				RequestCurrentUserRecommendationVotes( recommendationIDs );
			}
		}
	} );
}

function SelectReviews( appid, context, reviewDayRange, startDate, endDate, forceClear )
{
	$J( "#ReviewsTab_summary" ).removeClass( "active" );
	$J( "#ReviewsTab_all" ).removeClass( "active" );
	$J( "#ReviewsTab_recent" ).removeClass( "active" );
	$J( "#ReviewsTab_positive" ).removeClass( "active" );
	$J( "#ReviewsTab_negative" ).removeClass( "active" );
	$J( "#ReviewsTab_funny" ).removeClass( "active" );
	$J( "#ReviewsTab_" + context ).addClass( "active" );

	$J( "#Reviews_summary" ).hide();
	$J( "#Reviews_all" ).hide();
	$J( "#Reviews_recent" ).hide();
	$J( "#Reviews_positive" ).hide();
	$J( "#Reviews_negative" ).hide();
	$J( "#Reviews_funny" ).hide();
	$J( "#Reviews_loading" ).show();

	var container = $J( "#Reviews_" + context );
	if ( forceClear )
	{
		container.empty()
	}
	if ( container.children().length == 0 )
	{
		LoadMoreReviews( appid, 0, reviewDayRange, startDate, endDate, context );
	}
}

function FilterReviewsToGraph( bCountAllReviews, startDate, endDate )
{
	if ( bCountAllReviews )
	{
		$J('#purchase_type_all').attr( 'checked', true );
	}
	else
	{
		$J('#purchase_type_steam').attr( 'checked', !bCountAllReviews );
	}

	$J('#review_start_date').val( startDate );
	$J('#review_end_date').val( endDate );
	if ( !$J('#review_date_range_histogram').attr( 'checked' ) && !$J('#review_date_range_exclude_histogram').attr( 'checked') )
	{
		$J('#review_date_range_histogram').attr('checked', true);
	}
	$J('#review_date_range_histogram').attr( 'disabled', false );
	$J('#review_date_range_exclude_histogram').attr( 'disabled', false );
	ShowFilteredReviews();
}

function FilterReviewsGraph( bCountAllReviews, startDate, endDate, bExclude )
{
	if ( bCountAllReviews )
	{
		$J('#purchase_type_all').attr( 'checked', true );
	}
	else
	{
		$J('#purchase_type_steam').attr( 'checked', !bCountAllReviews );
	}

	$J('#review_start_date').val( startDate );
	$J('#review_end_date').val( endDate );

	$J('#review_date_range_histogram').attr( 'disabled', false );
	$J('#review_date_range_exclude_histogram').attr( 'disabled', false );

	if ( bExclude )
	{
		$J('#review_date_range_exclude_histogram').attr( 'checked', true );
	}
	else
	{
		$J('#review_date_range_histogram').attr( 'checked', true );
	}

	ShowFilteredReviews();
}

function ClearReviewTypeFilter()
{
	$J('#review_type_all').attr( 'checked', true );
	ShowFilteredReviews();
}

function ClearReviewPurchaseTypeFilter()
{
	$J('#purchase_type_all').attr( 'checked', true );
	ShowFilteredReviews();
}

function ClearReviewLanguageFilter()
{
	$J('#review_language_all').attr( 'checked', true );
	ShowFilteredReviews();
}

function ClearReviewDateRangeFilter()
{
	$J('#review_date_range_all').attr( 'checked', true );
	ClearReviewDateFilter();
}

function BuildReviewHistogram()
{
	if( $J( "#review_histograms_container" ).length == 0 )
		return;

	var appid = $J( "#review_appid" ).val();

	$J.get( 'http://store.steampowered.com/appreviewhistogram/' + appid, { l: 'tchinese' }
	).done( function( data ) {

		$J( "#review_histograms_container" ).addClass( "has_data" );

		// remove so we can draw to the canvas
		$J( "#review_histograms_container" ).removeClass( "collapsed" );
		$J( "#reviews_filter_options" ).removeClass( "graph_collapsed" );

		var bCountAllReviews = data.count_all_reviews;
		// language
		var elemLanguageBreakdown = $J( "#review_language_breakdown" );

		var numTotalDays = ( data.results.end_date - data.results.start_date ) / 86400;
		var numReviewsRecent = 0;
		for ( var i = 0; i < data.results.recent.length; ++i )
		{
			var recentDay = data.results.recent[i];
			numReviewsRecent += recentDay.recommendations_up + recentDay.recommendations_down;
		}

		if ( numTotalDays < 7 )
		{
			$J( "#app_reviews_hash" ).addClass( "graph_hidden" );
			$J( "#review_histogram_rollup_container" ).hide();
			$J( "#review_histogram_rollup_section" ).addClass( "recent" );
			$J( "#review_histogram_rollup_section" ).addClass( "hidden" );
			$J( "#review_histogram_recent_section" ).hide();
			return;
		}
		else if ( numReviewsRecent == 0 )
		{
			data.results.recent = null;
			$J( "#review_histogram_rollup_section" ).addClass( "recent" );
			$J( "#review_histogram_recent_section" ).hide();
		}
		else if ( numTotalDays < 30 )
		{
			$J( "#review_histogram_rollup_section" ).addClass( "recent" );
			$J( "#review_histogram_recent_section" ).hide();

			data.results.rollups = data.results.recent;
			data.results.recent = null;
			data.results.rollup_type = 'day';
		}

		var chartDataPositive = [];
		var chartDataNegative = [];

		for ( var i = 0; i < data.results.rollups.length; ++i )
		{
			var rollup = data.results.rollups[i];
			var barDataUp = [ rollup.date * 1000, rollup.recommendations_up ];
			var barDataDown = [ rollup.date * 1000, -rollup.recommendations_down ];
			chartDataPositive.push( barDataUp );
			chartDataNegative.push( barDataDown );
		}
		var seriesRollup = [ { label: "好評", color: "#66c0f4", fillColor: "#66c0f4", data: chartDataPositive }, { label: "負評", color: "#A34C25", fillColor: "#A34C25", data: chartDataNegative } ];

		var seriesRecent = null;
		if ( data.results.recent )
		{
			chartDataPositive = [];
			chartDataNegative = [];
			for ( var i = 0; i < data.results.recent.length; ++i )
			{
				var recentDay = data.results.recent[i];
				var barDataUp = [ recentDay.date * 1000, recentDay.recommendations_up ];
				var barDataDown = [ recentDay.date * 1000, -recentDay.recommendations_down ];
				chartDataPositive.push( barDataUp );
				chartDataNegative.push( barDataDown );
			}
			seriesRecent = [ { color: "#66c0f4", label: "好評", data: chartDataPositive }, { color: "#A34C25", label: "負評", data: chartDataNegative } ];
		}

		var options = {
			series: {
				stack: 0,
				bars: {
					show: 1,
					fill: 1,
					lineWidth: 0,
					barWidth: 86400*1000 * 0.5,
					align: "left"
				},
				lines: {
					show: 0
				},
				highlightColor: 'rgb(255,255,255)'
			},
			legend: {
				show: 0
			},
			xaxis: {
				mode: "time",
				timeformat: "%b %d",
				timezone: "utc",
				tickLength: 0
			},
			yaxis: {
				tickFormatter : function( val, axis ) {
					return ( val < 0 ) ? -val : val;
				},
				tickLength: 0,
				tickDecimals: 0
			},
			grid: {
				hoverable: true,
				clickable: true,
				borderWidth: 0,
				margin: 0,
				mouseActiveRadius: 10,
				autoHighlight: true,
				markings: [ { yaxis: { from: 0, to: 0 }, color: "#4582A5" } ]
			},
			selection: {
				mode: "x",
				color: "#ffffff",
			}
		};

		// week/month rollup
		var rollupOptions = $J.extend( true, {}, options );
		if ( data.results.rollup_type == 'week' )
		{
			if ( numTotalDays > 365 / 2 )
			{
				rollupOptions.xaxis.timeformat = "%b";
			}
			else
			{
				rollupOptions.xaxis.timeformat = "%b %d";
			}
			rollupOptions.series.bars.barWidth = 86400*1000 * 7 * 0.5;
		}
		else if ( data.results.rollup_type == 'month' )
		{
			rollupOptions.xaxis.timeformat = numTotalDays > 365 ? "%b %Y": "%b";
			rollupOptions.series.bars.barWidth = 86400*1000 * 30 * 0.5;
		}
		var graphRollup =  $J( "#review_histogram_rollup" );
		var flotRollup = $J.plot( graphRollup, seriesRollup, rollupOptions );

		// recent
		var graphRecent = null;
		if ( seriesRecent )
		{
			var recentOptions = $J.extend( true, {}, options );
			recentOptions.series.bars.barWidth = 86400*1000 * 0.5;
			recentOptions.xaxis.timeformat = "%b %d";
			var graphRecent =  $J( "#review_histogram_recent" );
			var flotRecent = $J.plot( graphRecent, seriesRecent, recentOptions );

			var recentGraphStartDate = data.results.recent[0].date * 1000;

			var rollupPoints = flotRollup.getData();
			var seriesPositive = rollupPoints[0];
			{
				var startX = seriesPositive.xaxis.p2c( recentGraphStartDate );
				var endPoint = seriesPositive.data[seriesPositive.data.length-1];
				var endX = seriesPositive.xaxis.p2c( endPoint[0] + rollupOptions.series.bars.barWidth );
				var highlightWidth = endX - startX;

				// get min/max of the yaxis
				var axes = flotRollup.getAxes();
				var startY = seriesPositive.yaxis.p2c( axes.yaxis.max );
				var endY = seriesPositive.yaxis.p2c( axes.yaxis.min );
				var highlightHeight = endY - startY;

				var funcDrawGraphOverlay = function() {

					var c = document.getElementById("review_graph_canvas");
					var ctx = c.getContext("2d");
					// resize the canvas to the same size as the element, so our drawing doesn't look blurry
					c.width = $J(c).width();
					c.height = $J(c).height();
					ctx.clearRect(0, 0, c.width, c.height);
					// these should be 1-to-1 now, but for correctness, we need to
					var scaleX = c.width / c.offsetWidth;
					var scaleY = c.height / c.offsetHeight;

					// draw rect on the graph
					ctx.fillStyle = 'rgba(148,217,255,0.2)';
					var offsets = flotRollup.getPlotOffset();
					var offsetLeft = ( offsets.left + startX ) + $J(flotRollup.getCanvas()).offsetParent().position().left;
					var offsetTop = ( offsets.top + startY ) + $J(flotRollup.getCanvas()).offsetParent().position().top;
					ctx.fillRect(offsetLeft * scaleX, offsetTop * scaleY, highlightWidth, highlightHeight);

					// now draw the "pop-out" on our other canvas
					offsetLeft = ( offsets.left + endX ) + $J(flotRollup.getCanvas()).offsetParent().position().left;
					offsetTop = ( offsets.top + startY ) + $J(flotRollup.getCanvas()).offsetParent().position().top;
					var offsetBottom = ( offsets.top + endY ) + $J(flotRollup.getCanvas()).offsetParent().position().top;
					var recentSection = $J("#review_histogram_recent_section");

					ctx.fillStyle = 'rgba(33,44,61,1)';
					ctx.beginPath();
					ctx.moveTo(offsetLeft * scaleX, offsetTop * scaleY);
					ctx.lineTo(recentSection.position().left * scaleX, recentSection.position().top * scaleY);
					ctx.lineTo(recentSection.position().left * scaleX, ( recentSection.position().top + recentSection.height() ) * scaleY);
					ctx.lineTo(offsetLeft * scaleX, offsetBottom * scaleY);
					ctx.lineTo(offsetLeft * scaleX, offsetTop * scaleY);
					ctx.fill();
				};

				$J("#review_graph_canvas").resize( funcDrawGraphOverlay );
				funcDrawGraphOverlay();
			}
		}

		// tooltip
		$J("<div id='review_histogram_tooltip'></div>").appendTo("body");
		var funcTooltip = function (event, pos, item) {
			var tooltip = $J("#review_histogram_tooltip");
			if ( item )
			{
				var x = item.datapoint[0].toFixed(2);
				var y = item.datapoint[1].toFixed(2);
				var numReviews = parseInt( y );
				var bNegativeReviews = numReviews < 0;
				var yDelta = bNegativeReviews ? 10 : ( -20 - tooltip.height() );
				var xDelta = 5;
				numReviews = Math.abs( numReviews );

				var date = new Date( parseInt(x) );

				var strDate = ( date.getUTCMonth() + 1 ) + "/" + ( date.getUTCDate() ) + "/" + date.getUTCFullYear();
				tooltip.html( numReviews + " " + item.series.label + " (" + strDate + ")" );
				tooltip.css( {top: item.pageY+yDelta, left: item.pageX+xDelta} );
				tooltip.fadeIn( 10 );

				tooltip.toggleClass( "negative", bNegativeReviews );
			}
			else
			{
				tooltip.hide();
			}
		};

		// click
		var funcClick = function( plot, rollupType ) {
			return function (event, pos, item) {
				// ignore for selection
				if ( plot.getSelection() )
				{
					return;
				}

				if ( item )
				{
					var x = item.datapoint[0].toFixed(2);
					var y = item.datapoint[1].toFixed(2);
					var numReviews = parseInt( y );
					var bNegativeReviews = numReviews < 0;

					var date = new Date( parseInt(x) );
					var startDate = date.getTime() / 1000;
					var endDate = startDate + 86400;
					if ( rollupType == 'week' )
					{
						endDate = startDate + 86400 * 7;
					}
					else if ( rollupType == 'month' )
					{
						var lastDayOfMonth = new Date( date.getUTCFullYear(), date.getUTCMonth() + 1, 0 );
						endDate = lastDayOfMonth.getTime() / 1000;
					}

					$J( bNegativeReviews ? '#review_type_negative' : '#review_type_positive').attr( 'checked', true );
					FilterReviewsToGraph( bCountAllReviews, startDate, endDate );

					flotRollup.clearSelection();
					if ( flotRecent )
					{
						flotRecent.clearSelection();
					}
				}
			}
		};

		var funcSelected = function( plot ) {
			return function (event, ranges) {

				var startDate = ranges.xaxis.from.toFixed(1) / 1000;
				var endDate = ranges.xaxis.to.toFixed(1) / 1000;

				$J( '#review_type_all' ).attr( 'checked', true );
				FilterReviewsToGraph( bCountAllReviews, startDate, endDate );
				if ( plot == flotRollup && flotRecent )
				{
					flotRecent.clearSelection();
				}
				else if ( plot == flotRecent )
				{
					flotRollup.clearSelection();
				}
			};
		};

		var funcUnSelected = function ( event ) {
			
		};

		graphRollup.bind("plothover", funcTooltip);
		graphRollup.bind("plotclick", funcClick( flotRollup, data.results.rollup_type ) );
		graphRollup.bind("plotselected", funcSelected( flotRollup ));
		graphRollup.bind("plotunselected", funcUnSelected );
		if ( graphRecent )
		{
			graphRecent.bind("plothover", funcTooltip);
			graphRecent.bind("plotclick", funcClick( flotRecent, 'day' ) );
			graphRecent.bind("plotselected", funcSelected( flotRecent ) );
			graphRecent.bind("plotunselected", funcUnSelected );
		}

		// recent events
		if ( data.results.recent_events && data.results.recent_events.length > 0 )
		{
			var event = data.results.recent_events[0];
			var container = $J( "#review_recent_events_container" );
			container.addClass( event.type );
			$J( "#recent_review_event_title" ).text( data.results.recent_events_title );
			$J( "#recent_review_event_dates" ).text( data.results.recent_event_dates );
			$J( "#recent_review_event_text" ).text( data.results.recent_events_text );
			$J( "#filter_reviews_to_event_btn" ).click( function() {
				$J( '#review_type_all' ).attr( 'checked', true );
				FilterReviewsGraph( bCountAllReviews, event.start_date, event.end_date, false );
				if ( flotRecent )
				{
					flotRecent.clearSelection();
				}
				flotRollup.clearSelection();
			});
			$J( "#filter_reviews_exclude_event_btn" ).click( function() {
				$J( '#review_type_all' ).attr( 'checked', true );
				FilterReviewsGraph( bCountAllReviews, event.start_date, event.end_date, true );
				if ( flotRecent )
				{
					flotRecent.clearSelection();
				}
				flotRollup.clearSelection();
			});
			container.show();
		}
		else
		{
			$J( "#review_histograms_container" ).addClass( "collapsed" );
			$J( "#reviews_filter_options" ).addClass( "graph_collapsed" );
		}

	} );
}

function SetReviewsGraphVisibility( bVisible )
{
	$J( "#review_histograms_container" ).toggleClass( "collapsed", !bVisible );
	$J( "#reviews_filter_options" ).toggleClass( "graph_collapsed", !bVisible );
}

function ClearReviewDateFilter()
{
	$J('#review_start_date').val( -1 );
	$J('#review_end_date').val( -1 );
	$J('#review_date_range_histogram').attr( 'disabled', true );
	$J('#review_date_range_exclude_histogram').attr( 'disabled', true );
	$J( "#review_selected_histogram_date_range_text" ).hide();
	ShowFilteredReviews();
}

function OnLoadReviews()
{
	BuildReviewHistogram();
	ShowFilteredReviews();
}

function UpdateActiveFilters()
{
	var bAnyActiveFilters = false;
	// type
	if ( $J( "#review_type_positive" ).attr( "checked" ) )
	{
		bAnyActiveFilters = true;
		$J( "#reviews_filter_type" ).show();
		$J( "#reviews_filter_type" ).text( '好評' );
	}
	else if ( $J( "#review_type_negative" ).attr( "checked" ) )
	{
		bAnyActiveFilters = true;
		$J( "#reviews_filter_type" ).show();
		$J( "#reviews_filter_type" ).text( '負評' );
	}
	else
	{
		$J( "#reviews_filter_type" ).hide();
	}

	// purchase type
	if ( $J( "#purchase_type_steam" ).attr( "checked" ) )
	{
		bAnyActiveFilters = true;
		$J( "#reviews_filter_purchase_type" ).show();
		$J( "#reviews_filter_purchase_type" ).text( 'Steam 購買' );
	}
	else if ( $J( "#purchase_type_non_steam" ).attr( "checked" ) )
	{
		bAnyActiveFilters = true;
		$J( "#reviews_filter_purchase_type" ).show();
		$J( "#reviews_filter_purchase_type" ).text( '透過 Steam 以外的管道購買' );
	}
	else
	{
		$J( "#reviews_filter_purchase_type" ).hide();
	}

	// language
	if ( $J( "#review_language_mine" ).attr( "checked" ) )
	{
		bAnyActiveFilters = true;
		$J( "#reviews_filter_language" ).show();
		$J( "#reviews_filter_language" ).text( '您的語言' );
	}
	else
	{
		$J( "#reviews_filter_language" ).hide();
	}

	// graph
	if ( $J( "#review_date_range_histogram" ).attr( "checked" ) )
	{
		bAnyActiveFilters = true;
		$J( "#reviews_filter_graph" ).show();
		$J( "#review_selected_histogram_date_range_prefix" ).text( '僅檢視 ' );
	}
	else if ( $J( "#review_date_range_exclude_histogram" ).attr( "checked" ) )
	{
		bAnyActiveFilters = true;
		$J( "#reviews_filter_graph" ).show();
		$J( "#review_selected_histogram_date_range_prefix" ).text( '不包括 ' );
	}
	else
	{
		$J( "#reviews_filter_graph" ).hide();
	}
	
	// beta
	var context = $J( "#review_context" ).val();
	if ( $J( "#ReviewBetaCheckbox" ).attr( "checked" ) && ( context == 'summary' || context == 'all' ) )
	{
		bAnyActiveFilters = true;
		$J( "#reviews_beta" ).show();
	}
	else
	{
		$J( "#reviews_beta" ).hide();
	}

	$J( "#reviews_filter_title" ).toggle( bAnyActiveFilters );
}

function ShowFilteredReviews()
{
	UpdateActiveFilters();

	var appid = $J( "#review_appid" ).val();
	var context = $J( "#review_context" ).val();
	var defaultDayRange = $J( "#review_default_day_range" ).val();
	var startDate = $J( "#review_start_date" ).val();
	var endDate = $J( "#review_end_date" ).val();
	SelectReviews( appid, context, defaultDayRange, startDate, endDate, true );
}

function ChangeReviewPurchaseTypeFilter()
{
	var purchaseType = $J('input[name="purchase_type"]:checked').val();
	V_SetCookie( "review_purchase_type_filter", purchaseType, purchaseType == 'all' ? 1 : 14, "app/" );
	ShowFilteredReviews();
}

function ChangedReviewHelpfulnessFilter()
{
	var bReviewBetaEnabled = $J( "#ReviewBetaCheckbox" ).is( ":checked" ) ? 1 : 0;
	V_SetCookie( "review_beta_enabled", bReviewBetaEnabled, 7, "app/" );
	ShowFilteredReviews();
}

function ClearReviewBetaFilter()
{
	$J('#ReviewBetaCheckbox').attr( 'checked', false );
	var bReviewBetaEnabled = false;
	V_SetCookie( "review_beta_enabled", bReviewBetaEnabled, 7, "app/" );
	ShowFilteredReviews();
}

function CollapseLongReviews()
{
	$J('.review_box').each( function(j, i){
		if( $J(i).outerHeight() > 400 )
		{
			if ( !$J(i).hasClass('expanded') )
			{
				$J(i).addClass('partial')
			}
		}
	});
}

//formerly app_reporting.js

var gReportedApp = false;
function ShowReportDialog( nAppId )
{
	if ( gReportedApp )
	{
		return;
	}

	var content = $J('<div/>', {'class': 'app_report_dialog' } );

	content.append( $J('<div/>', {'class': 'app_report_dialog_intro' } ).text('請選擇您回報此產品的原因。') );

		var rgReportOptions = {"1":"\u8a50\u9a19 - <span class=\"sub\">\u9019\u500b\u8edf\u9ad4\u6703\u5229\u7528\u8a50\u9a19\u624b\u6bb5\u9a19\u53d6\u500b\u4eba\u8cc7\u8a0a\uff0c\u4f8b\u5982\u60a8\u7684 Steam \u6191\u8b49\u6216\u8ca1\u52d9\u8cc7\u8a0a ( \u4f8b\uff1a\u60a8\u7684\u4fe1\u7528\u5361\u8cc7\u6599 )<\/span>","2":"\u5177\u50b7\u5bb3\u6027 - <span class=\"sub\">\u9019\u500b\u8edf\u9ad4\u6703\u5229\u7528\u7121\u9810\u671f\uff0c\u6216\u76f4\u63a5\u5177\u6709\u50b7\u5bb3\u6027\u7684\u624b\u6bb5\u7be1\u6539\u9867\u5ba2\u96fb\u8166\u4e2d\u7684\u8cc7\u6599\uff08\u4f8b\u5982\uff1a\u60e1\u610f\u8edf\u9ad4\u3001\u75c5\u6bd2\uff09<\/span>","3":"\u4ec7\u6068\u8a00\u8ad6 - <span class=\"sub\">\u5167\u542b\u4ec7\u6068\u6027\u7684\u8a00\u8ad6\uff0c\u4f8b\u5982\u91dd\u5c0d\u7279\u5b9a\u5718\u9ad4\u6216\u4eba\u7fa4\u7684\u7a2e\u65cf\u3001\u5b97\u6559\u3001\u6027\u5225\u3001\u5e74\u9f61\u3001\u6b98\u969c\u3001\u6027\u50be\u5411\uff0c\u63d0\u51fa\u5177\u4ec7\u6068\u3001\u66b4\u529b\u6216\u6b67\u8996\u7684\u8a00\u8a9e\u3002<\/span>","4":"\u8272\u60c5 - <span class=\"sub\">\u5167\u542b\u8272\u60c5\u5167\u5bb9<\/span>","5":"\u6210\u4eba\u5167\u5bb9 - <span class=\"sub\">\u5167\u542b\u5c1a\u672a\u6070\u7576\u6a19\u793a\u548c\u5206\u7d1a\u7684\u6210\u4eba\u5167\u5bb9<\/span>","6":"\u8ab9\u8b17 - <span class=\"sub\">\u5167\u542b\u8ab9\u8b17\u3001\u4e2d\u50b7\u8a00\u8a9e<\/span>","7":"\u5177\u5192\u72af\u6027 - <span class=\"sub\">\u8edf\u9ad4\u5167\u542b\u53ef\u8b93\u4f7f\u7528\u8005\u53d7\u516c\u7136\u5192\u72af\uff0c\u6216\u53d7\u523b\u610f\u9a5a\u5687\uff0c\u6216\u8b93\u4f7f\u7528\u8005\u8a0e\u53ad\u7684\u5167\u5bb9<\/span>","8":"\u5b69\u7ae5\u525d\u524a - <span class=\"sub\">\u5167\u542b\u4ee5\u4efb\u4f55\u65b9\u5f0f\u525d\u524a\u6216\u5229\u7528\u5b69\u7ae5\u7684\u5167\u5bb9<\/span>","11":"\u9055\u6cd5 - <span class=\"sub\">\u5167\u542b\u9055\u53cd\u7576\u5730\u6cd5\u5f8b\u7684\u5167\u5bb9<\/span>","13":"\u640d\u58de - <span class=\"sub\">\u5373\u4f7f\u96fb\u8166\u6709\u9054\u5230\u6700\u4f4e\u7cfb\u7d71\u9700\u6c42\u4ecd\u7121\u6cd5\u6b63\u78ba\u4e0b\u8f09\u3001\u555f\u52d5\uff0c\u6216\u57f7\u884c\u3002<\/span>"};
	var rgReportOptionElements = [];
	for ( var eReportType in rgReportOptions )
	{
		var $ReportOption = $J('<div/>', {'class': 'app_report_dialog_option' } );
		$ReportOption.append( $J('<div/>', {'class': 'app_report_dialog_option_input' }).append( $J('<input/>', {'type': 'radio', 'name':'report_type', 'value': eReportType, 'id': 'report_type_' + eReportType } ) ) );
		$ReportOption.append( $J('<div/>', {'class': 'app_report_dialog_option_text' }).append( $J('<label/>', {'for': 'report_type_' + eReportType }).html( rgReportOptions[eReportType] ) ) );
		rgReportOptionElements.push( $ReportOption );
	}

	for ( var j, x, i = rgReportOptionElements.length; i; j = parseInt(Math.random() * i), x = rgReportOptionElements[--i], rgReportOptionElements[i] = rgReportOptionElements[j], rgReportOptionElements[j] = x );
	for ( var i = 0; i < rgReportOptionElements.length; ++i )
	{
		content.append( rgReportOptionElements[i] );
	}

	var textArea = $J('<textarea/>', { 'class': 'app_report_dialog_reason', 'id' : 'ReportReason',  'name' : 'report_reason' } );
	var maxReasonLength = 512;
	textArea.attr( 'maxlength', maxReasonLength );
	textArea.bind( "keyup change",
		function()
		{
			var str = $J(this).val()
			var mx = parseInt($J(this).attr('maxlength'))
			if (str.length > mx)
			{
				$J(this).val(str.substr(0, mx))
				return false;
			}
		}
	);
	content.append( $J('<div/>', {'class': 'app_report_dialog_intro' } ).text('您可以在此提供您認為相關的額外資訊：') );
	content.append( textArea );

	content.append( $J('<div/>', {'class': 'app_report_dialog_dmca' } ).html('如果您想舉報著作權侵害事件且為著作權所有者的話，請點選<a href="http://steamcommunity.com/dmca/create/">這裡</a>進入我們的 DMCA 著作權侵害申訴表格。') );

	var dialog = ShowConfirmDialog( '回報此產品', content, '回報');

	dialog.done( function() {
		var eReportTypeSelected = content.find( 'input[type=radio]:checked' ).val();
		if ( eReportTypeSelected )
		{
			$J.post(
				'http://store.steampowered.com/appreport/' + nAppId + '/report/',
				{
					'report_type' : eReportTypeSelected,
					'report_reason' : content.find( 'textarea' ).val(),
					'sessionid': g_sessionID
				}
			).done( function( json ) {
					gReportedApp = true;
					$J( "#ReportAppBtn").addClass( 'btn_active' );
				}
			).fail( function( jqXHR ) {
					var json = jqXHR.responseText.evalJSON();
					if ( json.success == 29 )
					{
						ShowAlertDialog( '錯誤', '您已經回報過此產品！' );
						gReportedApp = true;
						$J( "#ReportAppBtn").addClass( 'btn_active' );
					}
					else
					{
						ShowAlertDialog( '錯誤', '儲存您的回報時發生錯誤，請稍後再試。' );
					}

				} );
		}
		else
		{
			ShowAlertDialog( '錯誤', '您必須選擇回報這項產品的原因！' );
		}
	});
}

function ShowGotSteamModal( strSteamURL, strAppName, strPlayLaunchVerb )
{
		var $ModalContent = $J("<div class=\"gotsteamModal\">\r\n\t<div class=\"got_steam_ctn\">\r\n\t<div class=\"got_steam_box\">\r\n\t\t<h1>\u5b89\u88dd Steam \u4e86\u55ce\uff1f<\/h1>\r\n\t\t<p>\u60a8\u5fc5\u9808\u8981\u5b89\u88dd <a href=\"http:\/\/store.steampowered.com\/about\/\">Steam \u684c\u9762\u61c9\u7528\u7a0b\u5f0f<\/a>\u624d\u80fd\u5b89\u88dd\u4e26\u555f\u52d5 <strong class=\"gotSteam_AppName\"><\/strong>\u3002\u60a8\u662f\u5426\u5728\u9019\u53f0\u96fb\u8166\u4e0a\u5df2\u7d93\u5b89\u88dd Steam\uff1f<\/p>\r\n\t\t<div class=\"gotsteam_buttons\">\r\n\t\t\t<a class=\"gotSteam_SteamURL btn_blue leftbtn\" href=\"\">\r\n\t\t\t\t<h3>\u662f\uff0cSteam \u5df2\u7d93\u5b89\u88dd\u597d<\/h3>\r\n\t\t\t\t<h5 class=\"gotsteam_action\"><\/h5>\r\n\t\t\t<\/a>\r\n\t\t\t<a href=\"http:\/\/store.steampowered.com\/about\/\" class=\"btn_blue\">\r\n\t\t\t\t<h3>\u4e0d\uff0c\u6211\u9700\u8981\u4e0b\u8f09 Steam<\/h3>\r\n\t\t\t\t<h5>\u4e86\u89e3\u4e26\u4e0b\u8f09 Steam<\/h5>\r\n\t\t\t<\/a>\r\n\t\t\t<div style=\"clear: left;\"><\/div>\r\n\t\t<\/div>\r\n\t\t<div class=\"got_steam_low_block\">\r\n\t\t\t<div class=\"gotsteam_steam_ico\"><img src=\"http:\/\/store.akamai.steamstatic.com\/public\/images\/v6\/steam_ico.png\" width=\"40\" height=\"40\" border=\"0\" \/><\/div>\r\n\t\t\tSteam \u662f\u9996\u5275\u684c\u9762\u904a\u6232\u5e73\u53f0\u3002\u52a0\u5165\u514d\u8cbb\u4e14\u4f7f\u7528\u5bb9\u6613\u3002 <a href=\"http:\/\/store.steampowered.com\/about\/\">\u9032\u4e00\u6b65\u77ad\u89e3 Steam\u3002<\/a>\r\n\t\t<\/div><\/div>\r\n\t<\/div>\r\n<\/div>");
	$ModalContent.find('.gotSteam_AppName').text( strAppName );
	$ModalContent.find('.gotsteam_action').text( strPlayLaunchVerb );
	$ModalContent.find( '.gotSteam_SteamURL').attr( 'href', strSteamURL );
	var Modal = new CModal( $ModalContent );
	Modal.Show();
	//ShowDialog( 'Got Steam?', $ModalContent );
}

function ChangeSeason( el, season )
{
	// switch active season indicator
	$J( '.series_seasons .season_selector .season_name' ).removeClass( 'active' );
	$J( el ).addClass( 'active' );
	
	// switch which episodes are shown
	$J( '.season_episode_list_wrapper .season_episode_list' ).removeClass( 'active' );
	$J( '.season_episode_list_wrapper .season_episode_list[data-season="' + season + '"]' ).addClass( 'active' );

	// load the images
	$J( '.season_episode_list.active .episode_image_col img').each( function( index, value )
	{
		$J( this ).attr( 'src', $J( this ).data( 'src' ) );
	});
}

function ShowRecommendedMoreInfoModal()
{
	var strTemplate = "<div class=\"recommended_more_info_modal\">\r\n\t\t\t\t\t\t\t\t<p class=\"intro\">\u9019\u6b3e\u7522\u54c1\u4f3c\u4e4e\u548c\u60a8\u4ee5\u524d\u4f7f\u7528\u904e\u7684\u4e0d\u592a\u76f8\u4f3c\u3002Steam \u6703\u8a66\u8457\u6839\u64da\u60a8\u73a9\u904e\u7684\u904a\u6232\u3001\u770b\u904e\u7684\u96fb\u5f71\u8207\u57f7\u884c\u904e\u7684\u8edf\u9ad4\u4e86\u89e3\u60a8\u7684\u500b\u4eba\u504f\u597d\uff0c\u4e26\u85c9\u6b64\u5c0b\u627e\u66f4\u7b26\u5408\u60a8\u8208\u8da3\u7684\u7522\u54c1\u63a8\u85a6\u7d66\u60a8\u3002<\/p>\r\n\t\t\t\t\t\t\t\t<h2>\u559c\u6b61\u9019\u9805\u7522\u54c1\uff1f<\/h2>\r\n\t\t\t\t\t\t\t\t<p>\u5982\u679c\u60a8\u559c\u6b61\u9019\u9805\u7522\u54c1\uff0c\u4e5f\u5be6\u969b\u8cfc\u5165\u548c\u4f7f\u7528\uff0c\u6211\u5011\u4fbf\u6703\u5c07\u6b64\u7d0d\u5165\u672a\u4f86\u63a8\u85a6\u6642\u7684\u53c3\u8003\u3002<\/p>\r\n\t\t\t\t\t\t\t\t<h2>\u5c0d\u9019\u985e\u7522\u54c1\u6c92\u8208\u8da3\uff1f<\/h2>\r\n\t\t\t\t\t\t\t\t<p>\u60a8\u4e5f\u53ef\u4ee5\u8abf\u6574\u60a8\u7684\u5546\u5e97\u504f\u597d\uff0c\u544a\u8a34 Steam \u60a8\u5c0d\u54ea\u4e9b\u985e\u578b\u6216\u5e36\u6709\u54ea\u4e9b\u6a19\u7c64\u7684\u7522\u54c1\u4e0d\u611f\u8208\u8da3\uff0c<a href=\"https:\/\/store.steampowered.com\/account\/preferences\/\">\u524d\u5f80\u5546\u5e97\u504f\u597d<\/a>\u3002<\/p>\r\n\t\t\t\t\t\t\t<\/div>";
	ShowAlertDialog( "\u6df1\u5165\u4e86\u89e3\u63a8\u85a6\u6a5f\u5236", strTemplate);

}

function CollapseLongStrings( strSelector )
{

	$J(strSelector).each(function(i, j){
		var $target = $J(j);
		if( j.scrollWidth >  $target.innerWidth() )
		{
			//$target.css({ 'overflow': 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' });
			var elMoreBtn = document.createElement('div');

			elMoreBtn.classList.add('more_btn');
			elMoreBtn.textContent = '+';
			elMoreBtn.addEventListener('click', function($target, elButton, event){

				$target.css({'overflow': 'visible', 'white-space': 'normal'});
				elButton.remove();

			}.bind(null, $target, elMoreBtn ));

			j.parentNode.appendChild(elMoreBtn);
		}
	})
}

function JSReportProductAction( appId, pageAction, snr )
{
	$J.post( 'http://store.steampowered.com//ajaxreportproductaction/' + appId + '/', {
			'page_action' : pageAction,
			'snr' : snr
		}
	);
}

